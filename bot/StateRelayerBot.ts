// @ts-ignore
import { getWhaleClient } from '@waveshq/walletkit-bot';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
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
    const provider = await signer.provider; // .getBlockNumber();
    const client = getWhaleClient(urlNetwork, envNetwork);
    const statsData = await client.stats.get();
    const rawPoolPairData = await client.poolpairs.list(200);
    const dexPriceData = await client.poolpairs.listDexPrices(DENOMINATION);
    const burnDataInfo = await client.stats.getBurn();

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
    burnedData.burnAddress = burnDataInfo.address;
    burnedData.amount = transformToEthersBigNumber(burnDataInfo.amount.toString(), DECIMALS);
    burnedData.tokens = burnDataInfo.tokens;
    burnedData.feeBurn = transformToEthersBigNumber(burnDataInfo.feeburn.toString(), DECIMALS);
    burnedData.emissionBurn = transformToEthersBigNumber(burnDataInfo.emissionburn.toString(), DECIMALS);
    burnedData.auctionBurn = transformToEthersBigNumber(burnDataInfo.auctionburn.toString(), DECIMALS);
    burnedData.paybackBurn = transformToEthersBigNumber(burnDataInfo.paybackburn.toString(), DECIMALS);
    burnedData.paybackBurnTokens = burnDataInfo.paybackburntokens;
    burnedData.dexFeeTokens = burnDataInfo.dexfeetokens;
    burnedData.dfiPaybackFee = transformToEthersBigNumber(burnDataInfo.dfipaybackfee.toString(), DECIMALS);
    burnedData.dfiPaybackTokens = burnDataInfo.dfipaybacktokens;
    burnedData.paybackFees = burnDataInfo.paybackfees;
    burnedData.paybackTokens = burnDataInfo.paybacktokens;
    burnedData.dfiP2203 = burnDataInfo.dfip2203;
    burnedData.dfiP2206F = burnDataInfo.dfip2206f;
    burnedData.decimals = DECIMALS;
    // Call SC Function to update Data
    // Update Dex information
    const dexInfoTx = await stateRelayerContract.updateDEXInfo(
      Object.keys(dataStore.pair),
      Object.values(dataStore.pair),
      totalValueLockInPoolPair,
      total24HVolume,
      { gasLimit: '24252373' },
    );
    await dexInfoTx.wait();
    await txStatus(dexInfoTx.hash, envNetwork, provider!);
    // Update Master Node information
    const masterDataTx = await stateRelayerContract.updateMasterNodeInformation(dataMasterNode, { gasLimit: '100000' });
    await masterDataTx.wait();
    await txStatus(masterDataTx.hash, envNetwork, provider!);
    // Update Vault general information
    const valutTx = await stateRelayerContract.updateVaultGeneralInformation(dataVault, { gasLimit: '250000' });
    await valutTx.wait();
    await txStatus(valutTx.hash, envNetwork, provider!);
    // Update Burn information
    const burnTx = await stateRelayerContract.updateBurnInfo(burnedData, { gasLimit: '250000' });
    await burnTx.wait();
    await txStatus(burnTx.hash, envNetwork, provider!);

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
}

async function txStatus(hash: string, envNetwork: EnvironmentNetwork, provider: ethers.providers.Provider) {
  if (envNetwork !== EnvironmentNetwork.LocalPlayground) {
    // const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_KEY);
    const txRec = await provider.getTransactionReceipt(hash);
    if (txRec.status === 0) {
      console.log('Transaction has failed');
    }
    console.log(`Successfully updated: https://changi.ocean.jellyfishsdk.com/tx/${hash}`);
  }
}
