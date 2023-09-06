import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { ethers } from 'hardhat';

import { StateRelayer, StateRelayer__factory } from '../../generated';

export async function deployContract(): Promise<DeployedContractAndSigner> {
  const accounts = await ethers.getSigners();
  const admin = accounts[0];
  const bot = accounts[1];
  const user = accounts[2];
  // Deploying StateRelayer contract
  const stateRelayerFactory = await ethers.getContractFactory('StateRelayer');
  const stateRelayer = await stateRelayerFactory.deploy();
  await stateRelayer.waitForDeployment();
  // Deploying StateRelayerProxy contract
  const stateRelayerProxyFactory = await ethers.getContractFactory('StateRelayerProxy');
  // Deployment arguments for the StateRelayerProxy
  const encodeFunctionData = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    admin.address,
    bot.address,
  ]);
  const stateProxy = await stateRelayerProxyFactory.deploy(await stateRelayer.getAddress(), encodeFunctionData);
  await stateProxy.waitForDeployment();
  const stateRelayerProxy = await ethers.getContractAt('StateRelayer', await stateProxy.getAddress());

  return { stateRelayerProxy, admin, bot, user };
}

interface DeployedContractAndSigner {
  stateRelayerProxy: StateRelayer;
  admin: SignerWithAddress;
  bot: SignerWithAddress;
  user: SignerWithAddress;
}
