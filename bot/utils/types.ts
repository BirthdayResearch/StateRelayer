// @ts-ignore
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { StateRelayer } from '../../generated';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type bigNumber = ethers.BigNumberish;

export type DataStore = {
  pair: PairData;
};

export type PairData = {
  [pairSymbol: string]: StateRelayer.DEXInfoStructOutput;
};
export type VaultData = StateRelayer.VaultGeneralInformationStructOutput;
export type MasterNodeData = StateRelayer.MasterNodeInformationStructOutput;
export type BurnedInformation = StateRelayer.BurnedInformationStructOutput;

export type StateRelayerHandlerProps = {
  testGasCost: boolean;
  urlNetwork: string;
  envNetwork: EnvironmentNetwork;
  contractAddress: string;
  signer: ethers.Signer;
};
