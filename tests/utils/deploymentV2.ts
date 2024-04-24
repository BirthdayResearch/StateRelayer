import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';

import { StateRelayer, StateRelayerV2, StateRelayerV2__factory } from '../../generated';
import { deployContract } from './deployment';

export async function deployV2Contract(): Promise<DeployedContractAndSigner> {
  const { stateRelayerProxy, admin, bot, user, stateRelayer } = await loadFixture(deployContract);
  // Deploying StateRelayerV2 contract
  const StateRelayerV2Upgradeable = await ethers.getContractFactory("StateRelayerV2");
  const stateRelayerV2Upgradeable = await StateRelayerV2Upgradeable.deploy();
  await stateRelayerV2Upgradeable.waitForDeployment();
  const encodedData = StateRelayerV2__factory.createInterface().encodeFunctionData("initialize", [
    // Contract version
    2,
  ]);

  // Upgrading the Proxy contract
  const stateRelayerV2Address = await stateRelayerV2Upgradeable.getAddress();
  await stateRelayerProxy
    .connect(admin)
    .upgradeToAndCall(stateRelayerV2Address, encodedData)
  const stateRelayerV2Proxy  = await ethers.getContractAt('StateRelayerV2', await stateRelayerProxy.getAddress());

  return { stateRelayerV2Proxy, stateRelayerProxy, stateRelayer,  bot, user, admin  };
}

export interface DeployedContractAndSigner {
  stateRelayerV2Proxy: StateRelayerV2;
  stateRelayerProxy: StateRelayer;
  stateRelayer: StateRelayer;
  admin: SignerWithAddress;
  bot: SignerWithAddress;
  user: SignerWithAddress;
}
