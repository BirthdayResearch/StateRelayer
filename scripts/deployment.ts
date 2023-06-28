import { ethers } from 'hardhat';

import { StateRelayer__factory } from '../generated';

// npx hardhat run --network floopyTestnet ./scripts/deployment.ts
async function main() {
  // Signer
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(balance.toString());
  const StateRelayerContract = await ethers.getContractFactory('StateRelayer');
  const stateRelayer = await StateRelayerContract.deploy({ gasLimit: 3000000 });
  await stateRelayer.deployed();

  console.log('State relayer Contract address: ', stateRelayer.address);
  // Data to pass to proxy contract
  const encodedData = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2', // Admin
    '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2', // Bot
  ]);
  // Deploying StateRelayerProxy contract
  const StateRelayerProxyContract = await ethers.getContractFactory('StateRelayerProxy');
  const stateRelayerProxy = await StateRelayerProxyContract.deploy(stateRelayer.address, encodedData);
  await stateRelayerProxy.deployed();
  console.log('Encoded Data: ', encodedData);
  console.log('State relayer proxy address: ', stateRelayerProxy.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
