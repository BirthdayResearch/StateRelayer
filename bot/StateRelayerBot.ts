// @ts-ignore
import { getWhaleClient } from '@waveshq/walletkit-bot';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';

import { StateRelayer, StateRelayer__factory } from '../generated';
import {
  BurnedInformation,
  DataStore,
  MasterNodeData,
  PairData,
  StateRelayerHandlerProps,
  VaultData,
} from './utils/types';

const DENOMINATION = 'USDT';
const DECIMALS = 10;

const transformToEthersBigNumber = (str: string, decimals: number): ethers.BigNumber =>
  ethers.BigNumber.from(
    new BigNumber(str).multipliedBy(new BigNumber('10').pow(decimals)).integerValue(BigNumber.ROUND_FLOOR).toString(),
  );

export async function handler(props: StateRelayerHandlerProps): Promise<DFCData | undefined> {
  const { urlNetwork, envNetwork, signer, contractAddress } = props;
  const stateRelayerContract = new ethers.Contract(contractAddress, StateRelayer__factory.abi, signer) as StateRelayer;
  const dataStore = {} as DataStore;
  const burnedData = {} as BurnedInformation;
  const dataVault = {} as VaultData;
  const dataMasterNode = {} as MasterNodeData;
  try {
    // TODO: Check if Function should run (blockHeight > 30 from previous)
    // Get Data from OCEAN API
    const client = getWhaleClient(urlNetwork, envNetwork);
    const statsData = await client.stats.get();
    const rawPoolPairData = await client.poolpairs.list(200);
    const dexPriceData = await client.poolpairs.listDexPrices(DENOMINATION);

    // sanitize response data
    const poolPairData = rawPoolPairData.filter((pair: any) => !pair.displaySymbol.includes('/'));

    /* ------------ Data from /dex ----------- */
    // totalValueLockInPoolPair
    const totalValueLockInPoolPair = transformToEthersBigNumber(statsData.tvl.dex.toString(), DECIMALS);
    // total24HVolume
    const total24HVolume = transformToEthersBigNumber(
      poolPairData.reduce((acc: any, currPair: any) => acc + (currPair.volume?.h24 ?? 0), 0).toString(),
      DECIMALS,
    );
    // /dex/pair
    const pair = poolPairData.reduce<PairData>((acc: any, currPair: any) => {
      let tokenPrice = new BigNumber(0);
      // price ratio is
      const priceRatio = currPair.priceRatio.ba;
      const { symbol } = currPair.tokenB;
      if (symbol === DENOMINATION || new BigNumber(priceRatio).isZero()) {
        tokenPrice = new BigNumber(priceRatio);
      } else {
        const dexPricePerToken = new BigNumber(dexPriceData.dexPrices[symbol]?.denominationPrice ?? 0);
        tokenPrice = dexPricePerToken.multipliedBy(currPair.priceRatio.ba);
      }
      return {
        ...acc,
        [currPair.displaySymbol]: {
          primaryTokenPrice: transformToEthersBigNumber(tokenPrice.toString(), DECIMALS),
          volume24H: transformToEthersBigNumber(currPair.volume?.h24.toString() ?? '0', DECIMALS),
          totalLiquidity: transformToEthersBigNumber(currPair.totalLiquidity.usd ?? '0', DECIMALS),
          APR: transformToEthersBigNumber(currPair.apr?.total.toString() ?? '0', DECIMALS),
          firstTokenBalance: transformToEthersBigNumber(currPair.tokenA.reserve, DECIMALS),
          secondTokenBalance: transformToEthersBigNumber(currPair.tokenB.reserve, DECIMALS),
          rewards: transformToEthersBigNumber(currPair.apr?.reward.toString() ?? '0', DECIMALS),
          commissions: transformToEthersBigNumber(currPair.commission, DECIMALS),
          decimals: DECIMALS,
        },
      } as PairData;
    }, {} as PairData);
    dataStore.pair = pair;

    // Data from vaults
    const totalLoanValue = statsData.loan.value.loan;
    const totalCollateralValue = statsData.loan.value.collateral;
    dataVault.noOfVaults = transformToEthersBigNumber(statsData.loan.count.openVaults.toString(), 0);
    dataVault.totalLoanValue = transformToEthersBigNumber(totalLoanValue.toString(), DECIMALS);
    dataVault.totalCollateralValue = transformToEthersBigNumber(totalCollateralValue.toString(), DECIMALS);
    dataVault.totalCollateralizationRatio = transformToEthersBigNumber(
      ((totalCollateralValue / totalLoanValue) * 100).toFixed(3).toString(),
      DECIMALS,
    );
    dataVault.activeAuctions = transformToEthersBigNumber(statsData.loan.count.openAuctions.toString(), 0);
    dataVault.decimals = DECIMALS;

    // Data from Master Nodes
    dataMasterNode.totalValueLockedInMasterNodes = transformToEthersBigNumber(
      statsData.tvl.masternodes.toString(),
      DECIMALS,
    );
    dataMasterNode.zeroYearLocked = transformToEthersBigNumber(statsData.masternodes.locked[0].count.toString(), 0);
    dataMasterNode.fiveYearLocked = transformToEthersBigNumber(statsData.masternodes.locked[2].count.toString(), 0);
    dataMasterNode.tenYearLocked = transformToEthersBigNumber(statsData.masternodes.locked[1].count.toString(), 0);
    dataMasterNode.decimals = DECIMALS;

    // Get Data from all burns in ecosystem
    burnedData.fee = transformToEthersBigNumber(statsData.burned.fee.toString(), DECIMALS);
    burnedData.auction = transformToEthersBigNumber(statsData.burned.auction.toString(), DECIMALS);
    burnedData.payback = transformToEthersBigNumber(statsData.burned.payback.toString(), DECIMALS);
    burnedData.emission = transformToEthersBigNumber(statsData.burned.emission.toString(), DECIMALS);
    burnedData.total = transformToEthersBigNumber(statsData.burned.total.toString(), DECIMALS);
    burnedData.decimals = DECIMALS;
    // Call SC Function to update Data
    // Update Dex information
    const dexInfoTx = await stateRelayerContract.updateDEXInfo(
      Object.keys(dataStore.pair),
      Object.values(dataStore.pair),
      totalValueLockInPoolPair,
      total24HVolume,
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
      dexInfoTxReceipt: await dexInfoTx.wait(),
      masterDataTxReceipt: await masterDataTx.wait(),
      vaultTxReceipt: await vaultTx.wait(),
      burnTxReceipt: await burnTx.wait(),
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
  dexInfoTxReceipt?: ethers.providers.TransactionReceipt;
  masterDataTxReceipt?: ethers.providers.TransactionReceipt;
  vaultTxReceipt?: ethers.providers.TransactionReceipt;
  burnTxReceipt?: ethers.providers.TransactionReceipt;
}
