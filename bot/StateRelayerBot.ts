import { getWhaleClient } from '@waveshq/walletkit-bot';
import { ethers } from 'ethers';

import { StateRelayer__factory } from '../generated';
import { tranformPairData, transformDataMasternode, transformDataVault } from './utils/transformData';
import { DataStore, MasterNodeData, StateRelayerHandlerProps, VaultData } from './utils/types';
import { ApiPagedResponse } from '@defichain/whale-api-client';
import { PoolPairData } from '@defichain/whale-api-client/dist/api/poolpairs';

const DENOMINATION = 'USDT';
const PAGESIZE = 50;

export async function handler(props: StateRelayerHandlerProps): Promise<DFCData | undefined> {
  const { urlNetwork, envNetwork, signer, contractAddress } = props;
  const stateRelayerContract = StateRelayer__factory.connect(contractAddress, signer);
  const dataStore = {} as DataStore;
  try {
    // TODO: Check if Function should run (blockHeight > 30 from previous)
    // Get Data from OCEAN API
    const client = getWhaleClient(urlNetwork, envNetwork);
    const statsData = await client.stats.get();

    let rawPoolPairData: Array<PoolPairData> = [];
    let pagedPoolPairData: ApiPagedResponse<PoolPairData> = await client.poolpairs.list(PAGESIZE);
    rawPoolPairData = rawPoolPairData.concat(pagedPoolPairData);
    while (pagedPoolPairData.hasNext) {
      pagedPoolPairData = await client.paginate(pagedPoolPairData);
      rawPoolPairData = rawPoolPairData.concat(pagedPoolPairData);
    }

    const dexPriceData = await client.poolpairs.listDexPrices(DENOMINATION);

    const inputForDexUpdate = tranformPairData(rawPoolPairData, statsData, dexPriceData);

    // Data from vaults
    const dataVault = transformDataVault(statsData);

    // Data from Master Nodes
    const dataMasterNode = transformDataMasternode(statsData);

    const nonce = await signer.getNonce();

    // Call SC Function to update Data
    // Update Dex information
    const dexInfoTx = await stateRelayerContract.updateDEXInfo(
      inputForDexUpdate.dex,
      inputForDexUpdate.dexInfo,
      inputForDexUpdate.totalValueLocked,
      inputForDexUpdate.total24HVolume,
      { gasLimit: 10_000_000, nonce: nonce },
    );

    // Update Master Node information
    const masterDataTx = await stateRelayerContract.updateMasterNodeInformation(dataMasterNode, {
      gasLimit: 200_000,
      nonce: nonce + 1,
    });

    // Update Vault general information
    const vaultTx = await stateRelayerContract.updateVaultGeneralInformation(dataVault, {
      gasLimit: 200_000,
      nonce: nonce + 2,
    });

    console.log('Hash of dex update transaction', dexInfoTx.hash);
    console.log('Hash of master update transaction', masterDataTx.hash);
    console.log('Hash of vault update transaction', vaultTx.hash);

    if (!props.testGasCost) {
      return {
        dataStore,
        dataVault,
        dataMasterNode,
      };
    }
    return {
      dataStore,
      dataVault,
      dataMasterNode,
      dexInfoTxReceipt: (await dexInfoTx.wait()) || undefined,
      masterDataTxReceipt: (await masterDataTx.wait()) || undefined,
      vaultTxReceipt: (await vaultTx.wait()) || undefined,
    };
  } catch (e) {
    console.error((e as Error).message);
    return undefined;
  }
}

interface DFCData {
  dataStore: DataStore;
  dataVault: VaultData;
  dataMasterNode: MasterNodeData;
  dexInfoTxReceipt?: ethers.ContractTransactionReceipt;
  masterDataTxReceipt?: ethers.ContractTransactionReceipt;
  vaultTxReceipt?: ethers.ContractTransactionReceipt;
}
