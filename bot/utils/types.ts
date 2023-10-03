import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { StateRelayer } from '../../generated';

export type DataStore = {
  pair: PairData;
};

export type PairData = {
  [pairSymbol: string]: StateRelayer.DEXInfoStruct;
};
export type VaultData = StateRelayer.VaultGeneralInformationStruct;
export type MasterNodeData = StateRelayer.MasterNodeInformationStruct;

export type StateRelayerHandlerProps = {
  testGasCost: boolean;
  urlNetwork: string;
  envNetwork: EnvironmentNetwork;
  contractAddress: string;
  signer: ethers.Signer;
  gasUpdateDEX?: bigint;
  gasUpdateMaster?: bigint;
  gasUpdateVault?: bigint;
};
