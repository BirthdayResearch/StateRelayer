// @ts-ignore
import { getWhaleClient } from '@waveshq/walletkit-bot';
import { ethers } from 'ethers';

import { StateRelayer__factory } from '../generated';
import {
  tranformPairData,
  transformBurnData,
  transformDataMasternode,
  transformDataVault,
} from './utils/transformData';
import { BurnedInformation, DataStore, MasterNodeData, StateRelayerHandlerProps, VaultData } from './utils/types';

const DENOMINATION = 'USDT';

export async function handler(props: StateRelayerHandlerProps): Promise<DFCData | undefined> {
  const { urlNetwork, envNetwork, signer, contractAddress } = props;
  const stateRelayerContract = StateRelayer__factory.connect(contractAddress, signer);
  const dataStore = {} as DataStore;
  try {
    // TODO: Check if Function should run (blockHeight > 30 from previous)
    // Get Data from OCEAN API
    const client = getWhaleClient(urlNetwork, envNetwork);
    const statsData = await client.stats.get();
    const burnDataInfo = await client.stats.getBurn();
    const rawPoolPairData = await client.poolpairs.list(200);
    const dexPriceData = await client.poolpairs.listDexPrices(DENOMINATION);

    const inputForDexUpdate = tranformPairData(rawPoolPairData, statsData, dexPriceData);

    // Data from vaults
    const dataVault = transformDataVault(statsData);

    // Data from Master Nodes
    const dataMasterNode = transformDataMasternode(statsData);

    // Data from burn
    const burnedData = transformBurnData(burnDataInfo);

    // Call SC Function to update Data
    // Update Dex information
    const dexInfoTx = await stateRelayerContract.updateDEXInfo(
      inputForDexUpdate.dex,
      inputForDexUpdate.dexInfo,
      inputForDexUpdate.totalValueLocked.toString(),
      inputForDexUpdate.total24HVolume.toString(),
    );

    // Update Master Node information
    const masterDataTx = await stateRelayerContract.updateMasterNodeInformation(dataMasterNode);
    // Update Vault general information
    const vaultTx = await stateRelayerContract.updateVaultGeneralInformation(dataVault);
    // Update Burn information
    const burnTx = await stateRelayerContract.updateBurnInfo(burnedData);
    if (!props.testGasCost) {
      return {
        dataStore,
        dataVault,
        dataMasterNode,
        burnedData,
      };
    }
    return {
      dataStore,
      dataVault,
      dataMasterNode,
      burnedData,
      dexInfoTxReceipt: (await dexInfoTx.wait()) || undefined,
      masterDataTxReceipt: (await masterDataTx.wait()) || undefined,
      vaultTxReceipt: (await vaultTx.wait()) || undefined,
      burnTxReceipt: (await burnTx.wait()) || undefined,
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
  burnedData: BurnedInformation;
  dexInfoTxReceipt?: ethers.ContractTransactionReceipt;
  masterDataTxReceipt?: ethers.ContractTransactionReceipt;
  vaultTxReceipt?: ethers.ContractTransactionReceipt;
  burnTxReceipt?: ethers.ContractTransactionReceipt;
}
