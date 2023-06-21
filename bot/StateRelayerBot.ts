/* eslint-disable no-console */
import { getWhaleClient } from '@waveshq/walletkit-bot';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';

import { StateRelayer, StateRelayer__factory } from '../generated';
import { BurnedInformation, DataStore, PairData, StateRelayerHandlerProps } from './types';

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
    dataStore.totalValueLockInPoolPair = statsData.tvl.dex.toString();

    // total24HVolume
    const total24HVolume = poolPairData.reduce((acc, currPair) => acc + (currPair.volume?.h24 ?? 0), 0);
    dataStore.total24HVolume = total24HVolume.toString();

    // pair
    const pair = poolPairData.reduce<PairData>((acc, currPair) => {
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
          // todo later
          lastUpdated: '0',
          decimals: DECIMALS,
        },
      } as PairData;
    }, {} as PairData);
    dataStore.pair = pair;
    // TODO: Get Data from /dex/[pool-pair]
    // TODO: Get Data from /vaults
    // TODO: Get Data from /masternodes
    // TODO: Get Data from all burns in ecosystem
    burnedData.fee = transformToEthersBigNumber(statsData.burned.fee.toString(), DECIMALS);
    burnedData.auction = transformToEthersBigNumber(statsData.burned.auction.toString(), DECIMALS);
    burnedData.payback = transformToEthersBigNumber(statsData.burned.payback.toString(), DECIMALS);
    burnedData.emission = transformToEthersBigNumber(statsData.burned.emission.toString(), DECIMALS);
    burnedData.total = transformToEthersBigNumber(statsData.burned.total.toString(), DECIMALS);
    burnedData.decimal = ethers.BigNumber.from(DECIMALS);
    // Interfacing with SC
    // TODO: Connect with SC
    // TODO: Call SC Function to update Collated Data
    await stateRelayerContract.updateDEXInfo(Object.keys(dataStore.pair), Object.values(dataStore.pair) as any);
    await stateRelayerContract.updateBurnInfo(Object.values(burnedData) as any);
    return { dataStore, burnedData };
  } catch (e) {
    console.error((e as Error).message);
    return undefined;
  }
}

interface DFCData {
  dataStore: DataStore;
  burnedData: BurnedInformation;
}
