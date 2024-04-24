import { DexPricesResult, PoolPairData } from '@defichain/whale-api-client/dist/api/poolpairs';
import { PriceTicker } from '@defichain/whale-api-client/dist/api/prices';
import { StatsData } from '@defichain/whale-api-client/dist/api/stats';
import { BigNumber } from 'bignumber.js';

import { IStateRelayer } from '../../generated/contracts/StateRelayerV2';
import { MasterNodeData, PairData, VaultData } from './types';

const DECIMALS = 18;
const DENOMINATION = 'USDT';
const MAXIMUM_UINT256 = 2n ** 256n - 1n;

const transformToBigInt = (val: BigNumber.Value, decimals: number): bigint => {
  const bigNumberVal = new BigNumber(val);
  let res: bigint;
  if (bigNumberVal.isNaN() || !bigNumberVal.isFinite()) res = MAXIMUM_UINT256;
  else {
    const bigIntVal = BigInt(bigNumberVal.multipliedBy(new BigNumber('10').pow(decimals)).toFixed(0, 1));
    res = bigIntVal < MAXIMUM_UINT256 ? bigIntVal : MAXIMUM_UINT256;
  }

  if (res === MAXIMUM_UINT256) console.log('Invalid value generated');
  return res;
};

export function transformDataVault(statsData: StatsData): VaultData {
  const totalLoanValue = statsData.loan.value.loan;
  const totalCollateralValue = statsData.loan.value.collateral;
  const dataVault: VaultData = {
    noOfVaultsNoDecimals: transformToBigInt(statsData.loan.count.openVaults, 0),
    totalLoanValue: transformToBigInt(totalLoanValue, DECIMALS),
    totalCollateralValue: transformToBigInt(totalCollateralValue, DECIMALS),
    totalCollateralizationRatio: transformToBigInt((totalCollateralValue / totalLoanValue) * 100, DECIMALS),
    activeAuctionsNoDecimals: transformToBigInt(statsData.loan.count.openAuctions, 0),
  };
  return dataVault;
}

export function transformDataMasternode(statsData: StatsData): MasterNodeData {
  const dataMasterNode: MasterNodeData = {
    totalValueLockedInMasterNodes: transformToBigInt(statsData.tvl.masternodes, DECIMALS),
    zeroYearLockedNoDecimals: transformToBigInt(
      statsData.masternodes.locked.find((i) => i.weeks === 0)?.count ?? NaN,
      0,
    ),
    fiveYearLockedNoDecimals: transformToBigInt(
      statsData.masternodes.locked.find((i) => i.weeks === 260)?.count ?? NaN,
      0,
    ),
    tenYearLockedNoDecimals: transformToBigInt(
      statsData.masternodes.locked.find((i) => i.weeks === 520)?.count ?? NaN,
      0,
    ),
  };
  return dataMasterNode;
}

export function tranformPairData(
  rawPoolPairData: Array<PoolPairData>,
  statsData: StatsData,
  dexPriceData: DexPricesResult,
): {
  dex: string[];
  dexInfo: IStateRelayer.DEXInfoStruct[];
  totalValueLocked: bigint;
  total24HVolume: bigint;
} {
  // sanitize response data
  const poolPairData = rawPoolPairData.filter((pair: PoolPairData) => !pair.displaySymbol.includes('/'));

  /* ------------ Data from /dex ----------- */
  const totalValueLockedInPoolPair = transformToBigInt(statsData.tvl.dex, DECIMALS);
  const total24HVolume = transformToBigInt(
    poolPairData.reduce((acc: number, currPair: PoolPairData) => acc + (currPair.volume?.h24 ?? 0), 0),
    DECIMALS,
  );

  // /dex/pair
  const pair = poolPairData.reduce<PairData>((acc: PairData, currPair: PoolPairData) => {
    let tokenPrice = new BigNumber(0);
    const priceRatio = currPair.priceRatio.ba;
    const { symbol } = currPair.tokenB;
    if (symbol === DENOMINATION || new BigNumber(priceRatio).isZero()) {
      tokenPrice = new BigNumber(priceRatio);
    } else {
      const dexPricePerToken = new BigNumber(dexPriceData.dexPrices[symbol]?.denominationPrice ?? NaN);
      tokenPrice = dexPricePerToken.multipliedBy(priceRatio);
    }
    return {
      ...acc,
      [currPair.displaySymbol]: {
        primaryTokenPrice: transformToBigInt(tokenPrice, DECIMALS),
        volume24H: transformToBigInt(currPair.volume?.h24 ?? NaN, DECIMALS),
        totalLiquidity: transformToBigInt(currPair.totalLiquidity.usd ?? NaN, DECIMALS),
        APR: transformToBigInt(currPair.apr?.total ?? NaN, DECIMALS),
        firstTokenBalance: transformToBigInt(currPair.tokenA.reserve, DECIMALS),
        secondTokenBalance: transformToBigInt(currPair.tokenB.reserve, DECIMALS),
        rewards: transformToBigInt(currPair.apr?.reward ?? NaN, DECIMALS),
        commissions: transformToBigInt(currPair.commission, DECIMALS),
      },
    };
  }, {});
  return {
    dex: Object.keys(pair),
    dexInfo: Object.values(pair),
    totalValueLocked: totalValueLockedInPoolPair,
    total24HVolume,
  };
}

export function transformOracleData(prices: PriceTicker[] ):{
  oracle: string[];
  oracleInfo: IStateRelayer.OracleInfoStruct[];
} {
  const data = prices.reduce((all, { id, price }) => ({
    ...all,
    [id]: {
      price: transformToBigInt(price.aggregated.amount, DECIMALS),
      oraclesActive: transformToBigInt(price.aggregated.oracles.active, DECIMALS),
      oraclesTotal:transformToBigInt(price.aggregated.oracles.total, DECIMALS)
    }
  }), {})
  return {
    oracle: Object.keys(data),
    oracleInfo: Object.values(data)
  }
}
