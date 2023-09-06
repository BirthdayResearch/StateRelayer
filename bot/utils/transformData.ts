import { poolpairs, stats } from '@defichain/whale-api-client';
import { BigNumber } from 'bignumber.js';

import { StateRelayer } from '../../generated';
import { BurnedInformation, MasterNodeData, PairData, VaultData } from './types';

const DECIMALS = 18;
const DENOMINATION = 'USDT';

type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R> ? R : any;
type BurnData = AsyncReturnType<typeof stats.Stats.prototype.getBurn>;
type StatsData = AsyncReturnType<typeof stats.Stats.prototype.get>;
type PoolPairData = AsyncReturnType<typeof poolpairs.PoolPairs.prototype.list>;
type DexPriceResult = AsyncReturnType<typeof poolpairs.PoolPairs.prototype.listDexPrices>;

const transformToBigInt = (str: string, decimals: number): bigint =>
  BigInt(new BigNumber(str).multipliedBy(new BigNumber('10').pow(decimals)).toFixed(0, 1));

const transformStringToArr = (str: string): StateRelayer.AMOUNT_TOKENStruct => {
  const splitArr = str.split('@');
  return {
    token: splitArr[1],
    amount: transformToBigInt(splitArr[0], DECIMALS),
  };
};

export function transformBurnData(burnDataInfo: BurnData): BurnedInformation {
  const burnedData = {} as BurnedInformation;
  // Get Data from all burns in ecosystem
  burnedData.addr = burnDataInfo.address;
  burnedData.amount = transformToBigInt(burnDataInfo.amount.toString(), DECIMALS);
  burnedData.tokens = burnDataInfo.tokens.map((ele) => transformStringToArr(ele));
  burnedData.feeburn = transformToBigInt(burnDataInfo.feeburn.toString(), DECIMALS);
  burnedData.emissionburn = transformToBigInt(burnDataInfo.emissionburn.toString(), DECIMALS);
  burnedData.auctionburn = transformToBigInt(burnDataInfo.auctionburn.toString(), DECIMALS);
  burnedData.paybackburn = transformToBigInt(burnDataInfo.paybackburn.toString(), DECIMALS);
  burnedData.paybackburntokens = burnDataInfo.paybackburntokens.map((ele) => transformStringToArr(ele));
  burnedData.paybacktokens = burnDataInfo.paybacktokens.map((ele) => transformStringToArr(ele));
  burnedData.dexfeetokens = burnDataInfo.dexfeetokens.map((ele) => transformStringToArr(ele));
  burnedData.dfipaybackfee = transformToBigInt(burnDataInfo.dfipaybackfee.toString(), DECIMALS);
  burnedData.dfipaybacktokens = burnDataInfo.dfipaybacktokens.map((ele) => transformStringToArr(ele));
  burnedData.paybackfees = burnDataInfo.paybackfees.map((ele) => transformStringToArr(ele));
  burnedData.paybackburntokens = burnDataInfo.paybackburntokens.map((ele) => transformStringToArr(ele));
  burnedData.dfip2203 = burnDataInfo.dfip2203.map((ele) => transformStringToArr(ele));
  burnedData.dfip2206f = burnDataInfo.dfip2206f.map((ele) => transformStringToArr(ele));
  return burnedData;
}

export function transformDataVault(statsData: StatsData): VaultData {
  const dataVault = {} as VaultData;

  const totalLoanValue = statsData.loan.value.loan;
  const totalCollateralValue = statsData.loan.value.collateral;
  dataVault.noOfVaultsNoDecimals = transformToBigInt(statsData.loan.count.openVaults.toString(), 0);
  dataVault.totalLoanValue = transformToBigInt(totalLoanValue.toString(), DECIMALS);
  dataVault.totalCollateralValue = transformToBigInt(totalCollateralValue.toString(), DECIMALS);
  dataVault.totalCollateralizationRatio = transformToBigInt(
    ((totalCollateralValue / totalLoanValue) * 100).toFixed(3).toString(),
    DECIMALS,
  );
  dataVault.activeAuctionsNoDecimals = transformToBigInt(statsData.loan.count.openAuctions.toString(), 0);

  return dataVault;
}

export function transformDataMasternode(statsData: StatsData): MasterNodeData {
  const dataMasterNode = {} as MasterNodeData;
  dataMasterNode.totalValueLockedInMasterNodes = transformToBigInt(statsData.tvl.masternodes.toString(), DECIMALS);
  dataMasterNode.zeroYearLockedNoDecimals = transformToBigInt(statsData.masternodes.locked[0].count.toString(), 0);
  dataMasterNode.fiveYearLockedNoDecimals = transformToBigInt(statsData.masternodes.locked[2].count.toString(), 0);
  dataMasterNode.tenYearLockedNoDecimals = transformToBigInt(statsData.masternodes.locked[1].count.toString(), 0);
  return dataMasterNode;
}

export function tranformPairData(
  rawPoolPairData: PoolPairData,
  statsData: StatsData,
  dexPriceData: DexPriceResult,
): {
  dex: string[];
  dexInfo: StateRelayer.DEXInfoStruct[];
  totalValueLocked: BigInt;
  total24HVolume: BigInt;
} {
  // sanitize response data
  const poolPairData = rawPoolPairData.filter((pair: any) => !pair.displaySymbol.includes('/'));

  /* ------------ Data from /dex ----------- */
  // totalValueLockInPoolPair
  const totalValueLockInPoolPair = transformToBigInt(statsData.tvl.dex.toString(), DECIMALS);
  // total24HVolume
  const total24HVolume = transformToBigInt(
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
        primaryTokenPrice: transformToBigInt(tokenPrice.toString(), DECIMALS),
        volume24H: transformToBigInt(currPair.volume?.h24.toString() ?? '0', DECIMALS),
        totalLiquidity: transformToBigInt(currPair.totalLiquidity.usd ?? '0', DECIMALS),
        APR: transformToBigInt(currPair.apr?.total.toString() ?? '0', DECIMALS),
        firstTokenBalance: transformToBigInt(currPair.tokenA.reserve, DECIMALS),
        secondTokenBalance: transformToBigInt(currPair.tokenB.reserve, DECIMALS),
        rewards: transformToBigInt(currPair.apr?.reward.toString() ?? '0', DECIMALS),
        commissions: transformToBigInt(currPair.commission, DECIMALS),
      },
    } as PairData;
  }, {} as PairData);
  return {
    dex: Object.keys(pair),
    dexInfo: Object.values(pair),
    totalValueLocked: totalValueLockInPoolPair,
    total24HVolume,
  };
}
