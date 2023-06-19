import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type bigNumber = ethers.BigNumberish;

export type PairData = {
  [pairSymbol: string]: {
    primaryTokenPrice: bigNumber;
    volume24H: bigNumber;
    totalLiquidity: bigNumber;
    APR: bigNumber;
    firstTokenBalance: bigNumber;
    secondTokenBalance: bigNumber;
    rewards: bigNumber;
    commissions: bigNumber;
    lastUpdated: bigNumber;
    decimals: bigNumber;
  };
};

export type DataStore = {
  // /dex
  totalValueLockInPoolPair: string;
  total24HVolume: string;
  pair: PairData;
};

export type VaultData = {
  vaults: string;
  totalLoanValue: bigNumber;
  totalCollateralValue: bigNumber;
  totalCollateralizationRatio: bigNumber;
  activeAuctions: bigNumber;
  lastUpdated: bigNumber;
};

export type MasterNodesData = {
  totalValueLockedInMasterNodes: bigNumber;
  zeroYearLocked: bigNumber;
  fiveYearLocked: bigNumber;
  tenYearLocked: bigNumber;
  lastUpdated: bigNumber;
};

export type StateRelayerHandlerProps = {
  urlNetwork: string;
  envNetwork: EnvironmentNetwork;
  contractAddress: string;
  signer: ethers.Signer;
};
