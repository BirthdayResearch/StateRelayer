import { ethers } from 'hardhat';

import { StateRelayer__factory } from '../generated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verify } from './utils/verify';

// npx hardhat run --network DMCTestnet ./scripts/deployment.ts
async function main() {
  const StateRelayerContract = await ethers.getContractFactory('StateRelayer');
  const stateRelayer = await StateRelayerContract.deploy({ gasLimit: 5000000 });
  await stateRelayer.deployTransaction.wait(5);
  console.log('State relayer Contract address: ', stateRelayer.address);
  console.log('Verifying........');
  await verify({ contractAddress: stateRelayer.address, contract: 'contracts/StateRelayer.sol:StateRelayer' });
  // Data to pass to proxy contract
  const encodedData = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2', // Admin
    '0x5aB853A40b3b9A16891e8bc8e58730AE3Ec102b2', // Bot
  ]);
  // Deploying StateRelayerProxy contract
  const StateRelayerProxyContract = await ethers.getContractFactory('StateRelayerProxy');
  const stateRelayerProxy = await StateRelayerProxyContract.deploy(stateRelayer.address, encodedData);
  await stateRelayerProxy.deployTransaction.wait(5);
  console.log('State relayer proxy address: ', stateRelayerProxy.address);
  console.log('Verifying........');
  await verify({
    contractAddress: stateRelayerProxy.address,
    args: [stateRelayer.address, encodedData],
    contract: 'contracts/StateRelayerProxy.sol:StateRelayerProxy',
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
