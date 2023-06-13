/* eslint-disable no-console */
import { getWhaleClient } from "@waveshq/walletkit-bot";
import { EnvironmentNetwork } from "@waveshq/walletkit-core";
import { BigNumber } from "bignumber.js";
import { ethers } from "ethers";

import { StateRelayer, StateRelayer__factory } from "../generated";

type PairData = {
  [pairSymbol: string]: {
    primaryTokenPrice: string;
    volume24H: string;
    totalLiquidity: string;
    apr: string;
    firstTokenBalance: string;
    secondTokenBalance: string;
    rewards: string;
    commissions: string;
    lastUpdated: string;
    decimals: string;
  };
};

type DataStore = {
  // /dex
  totalValueLockInPoolPair: string;
  total24HVolume: string;
  pair: PairData;
};

type StateRelayerHandlerProps = {
  urlNetwork: string;
  envNetwork: EnvironmentNetwork;
  contractAddress: string;
  signer: ethers.Signer;
};

const DENOMINATION = "USDT";

export async function handler(
  props: StateRelayerHandlerProps
): Promise<DataStore | undefined> {
  const { urlNetwork, envNetwork, signer, contractAddress } = props;
  const stateRelayerContract = new ethers.Contract(
    contractAddress,
    StateRelayer__factory.abi,
    signer
  ) as StateRelayer;
  const dataStore = {} as DataStore;
  try {
    // TODO: Check if Function should run (blockHeight > 30 from previous)
    // Get Data from OCEAN API
    const client = getWhaleClient(urlNetwork, envNetwork);
    const statsData = await client.stats.get();
    const rawPoolpairData = await client.poolpairs.list(200);
    const dexPriceData = await client.poolpairs.listDexPrices(DENOMINATION);

    // sanitise response data
    const poolpairData = rawPoolpairData.filter(
      (pair: any) => !pair.displaySymbol.includes("/")
    );

    /* ------------ Data from /dex ----------- */
    // totalValueLockInPoolPair
    dataStore.totalValueLockInPoolPair = statsData.tvl.dex.toString();

    // total24HVolume
    const total24HVolume = poolpairData.reduce(
      (acc, currPair) => acc + (currPair.volume?.h24 ?? 0),
      0
    );
    dataStore.total24HVolume = total24HVolume.toString();

    // pair
    const pair = poolpairData.reduce<PairData>((acc, currPair) => {
      let tokenPrice = new BigNumber(0);
      // price ratio is
      const priceRatio = currPair.priceRatio.ba;
      const { symbol } = currPair.tokenB;
      if (symbol === DENOMINATION || new BigNumber(priceRatio).isZero()) {
        tokenPrice = new BigNumber(priceRatio);
      } else {
        const dexPricePerToken = new BigNumber(
          dexPriceData.dexPrices[symbol]?.denominationPrice ?? 0
        );
        tokenPrice = dexPricePerToken.multipliedBy(currPair.priceRatio.ba);
      }
      return {
        ...acc,
        [currPair.displaySymbol]: {
          primaryTokenPrice: tokenPrice.toString(),
          volume24H: currPair.volume?.h24.toString() ?? "0",
          totalLiquidity: currPair.totalLiquidity.usd ?? "0",
          apr: currPair.apr?.total.toString() ?? "0",
          firstTokenBalance: currPair.tokenA.reserve,
          secondTokenBalance: currPair.tokenB.reserve,
          rewards: currPair.apr?.reward.toString() ?? "0",
          commissions: currPair.commission,
          // todo later
          lastUpdated: "0",
          // todo later
          decimals: "10",
        },
      } as PairData;
    }, {} as PairData);
    dataStore.pair = pair;
    // TODO: Get Data from /dex/[pool-pair]
    // TODO: Get Data from /vaults
    // TODO: Get Data from /masternodes
    // TODO: Get Data from all burns in ecosystem
    // Interfacing with SC
    // TODO: Connect with SC
    // TODO: Call SC Function to update Collated Data
    await stateRelayerContract.updateDEXInfo(
      Object.keys(dataStore.pair),
      Object.values(dataStore.pair) as any
    );
    return dataStore;
  } catch (e) {
    console.error((e as Error).message);
    return undefined;
  }
}
