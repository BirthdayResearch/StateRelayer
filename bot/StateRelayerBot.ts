import { ApiPagedResponse } from '@defichain/whale-api-client';
import { PoolPairData } from '@defichain/whale-api-client/dist/api/poolpairs';
import { PriceTicker } from '@defichain/whale-api-client/dist/api/prices';
import { getWhaleClient } from '@waveshq/walletkit-bot';
import { ethers } from 'ethers';

import { StateRelayer__factory } from '../generated';
import { tranformPairData, transformDataMasternode, transformDataVault, transformOracleData } from './utils/transformData';
import { DataStore, MasterNodeData, StateRelayerHandlerProps, VaultData } from './utils/types';

const DENOMINATION = 'USDT';
const PAGESIZE = 50;

export async function handler(props: StateRelayerHandlerProps): Promise<DFCData | undefined> {
  const { urlNetwork, envNetwork, signer, contractAddress, enableOracleUpdate } = props;
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

    const ETHDFIRawData = rawPoolPairData.find((rawData) => rawData.symbol === 'ETH-DFI');
    if (ETHDFIRawData) {
      // Note: added DFI-ETH to calculate DFI price as a primaryTokenPrice.
      const DFIETHRawData = {
        ...ETHDFIRawData,
        symbol: 'DFI-ETH',
        displaySymbol: 'DFI-dETH',
        name: 'Default Defi token-Ether',
        priceRatio: {
          ab: ETHDFIRawData.priceRatio.ba,
          ba: ETHDFIRawData.priceRatio.ab,
        },
        tokenA: {
          ...ETHDFIRawData.tokenB,
          reserve: '0', // setting value to 0 as pair dose not exists
        },
        tokenB: {
          ...ETHDFIRawData.tokenA,
          reserve: '0',
        },
        commission: '0',
        rewardPct: '0',
        apr: {
          reward: 0,
          commission: 0,
          total: 0
        },
        volume: {
          h24: 0,
          d30: 0
        },
        totalLiquidity: {
          token: '0',
          usd: '0'
        }
      };
      rawPoolPairData.push(DFIETHRawData);
    }

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
      { nonce, gasLimit: props.gasUpdateDEX },
    );
    console.log('Hash of dex update transaction', dexInfoTx.hash);

    // Update Master Node information
    const masterDataTx = await stateRelayerContract.updateMasterNodeInformation(dataMasterNode, {
      nonce: nonce + 1,
      gasLimit: props.gasUpdateMaster,
    });
    console.log('Hash of master update transaction', masterDataTx.hash);

    // Update Vault general information
    const vaultTx = await stateRelayerContract.updateVaultGeneralInformation(dataVault, {
      nonce: nonce + 2,
      gasLimit: props.gasUpdateVault,
    });
    console.log('Hash of vault update transaction', vaultTx.hash);

    let oracleInfoTx;
    if (enableOracleUpdate) {
      // Data for Oracles
      let rawPriceData: Array<PriceTicker> = [];
      let pagedPriceData: ApiPagedResponse<PriceTicker> = await client.prices.list(PAGESIZE);
      rawPriceData = rawPriceData.concat(pagedPriceData);
      while (pagedPriceData.hasNext) {
        pagedPriceData = await client.paginate(pagedPriceData);
        rawPriceData = rawPriceData.concat(pagedPriceData);
      }

      const inputForOracleUpdate = transformOracleData(rawPriceData)
      // Update Oracle information
      oracleInfoTx = await stateRelayerContract.updateOracleInfo(
        inputForOracleUpdate.oracle,
        inputForOracleUpdate.oracleInfo,
        { nonce: nonce + 3, gasLimit: props.gasUpdateOracle },
      );
      console.log('Hash of oracle update transaction', oracleInfoTx.hash);
      
    }

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
      oracleInfoTxReceipt: (await oracleInfoTx?.wait()) || undefined,
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
  oracleInfoTxReceipt?: ethers.ContractTransactionReceipt;
}
