import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { IStateRelayer } from '../../generated';

export type DataStore = {
  pair: PairData;
};

export type PairData = {
  [pairSymbol: string]: IStateRelayer.DEXInfoStruct;
};
export type VaultData = IStateRelayer.VaultGeneralInformationStruct;
export type MasterNodeData = IStateRelayer.MasterNodeInformationStruct;

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
