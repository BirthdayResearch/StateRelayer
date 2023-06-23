import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type bigNumber = ethers.BigNumberish;

export type DataStore = {
    pair: PairData;
};

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
    decimals: bigNumber;
  };
};

export type VaultData = {
    noOfVaults: bigNumber;
    totalLoanValue: bigNumber;
    totalCollateralValue: bigNumber;
    totalCollateralizationRatio: bigNumber;
    activeAuctions: bigNumber;
    decimals: bigNumber;
};

export type MasterNodesData = {
    totalValueLockedInMasterNodes: bigNumber;
    zeroYearLocked: bigNumber;
    fiveYearLocked: bigNumber;
    tenYearLocked: bigNumber;
    decimals: bigNumber;
};

export type StateRelayerHandlerProps = {
    urlNetwork: string;
    envNetwork: EnvironmentNetwork;
    contractAddress: string;
    signer: ethers.Signer;
};
