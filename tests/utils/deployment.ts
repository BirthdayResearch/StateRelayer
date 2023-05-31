import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

import { StateRelayer, StateRelayer__factory } from '../../generated';

export async function deployContract(): Promise<DeployedContractAndSigner> {
  const accounts = await ethers.provider.listAccounts();
  const admin = await ethers.getSigner(accounts[0]);
  const bot = await ethers.getSigner(accounts[1]);
  // Deploying StateRelayer contract
  const stateRelayerFactory = await ethers.getContractFactory('StateRelayer');
  const stateRelayer = await stateRelayerFactory.deploy();
  await stateRelayer.deployed();
  // Deploying StateRelayerProxy contract
  const stateRelayerProxyFactory = await ethers.getContractFactory('StateRelayerProxy');
  // Deployment arguments for the StateRelayerProxy
  const encodeFunctionData = StateRelayer__factory.createInterface().encodeFunctionData(
    'initialize',
    [admin.address, bot.address]
  );
  const stateProxy = await stateRelayerProxyFactory.deploy(
    stateRelayer.address,
    encodeFunctionData
  );
  await stateProxy.deployed();
  const stateRelayerProxy = stateRelayerFactory.attach(stateProxy.address);
  return { stateRelayerProxy, admin, bot };
}

interface DeployedContractAndSigner {
  stateRelayerProxy: StateRelayer;
  admin: SignerWithAddress;
  bot: SignerWithAddress;
}
