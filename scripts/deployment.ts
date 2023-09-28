import { ethers } from 'hardhat';

import { StateRelayer__factory } from '../generated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verify } from './utils/verify';

// npx hardhat run --network DMCTestnet ./scripts/deployment.ts
// To deploy Smart contract without providing private keys in evn. Below uses the truffle dashboard with metamask.
// If running below command, run in the following steps. Confirm the tx on: http://localhost:24012/rpcs (By default)
// npx truffle dashboard
// npx hardhat run --network truffleDashboard ./scripts/deployment.ts
async function main() {
  const stateRelayer = await ethers.deployContract('StateRelayer');
  await stateRelayer.deploymentTransaction()?.wait(5);
  const stateRelayerAddress = await stateRelayer.getAddress();
  console.log('State relayer Contract address: ', stateRelayerAddress);
  console.log('Verifying........');
  await verify({ contractAddress: stateRelayerAddress, contract: 'contracts/StateRelayer.sol:StateRelayer' });
  // Data to pass to proxy contract
  const encodedData = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    '0x17D6bb95cCF124324995F08204132cdf75048284', // Admin
    '0x17D6bb95cCF124324995F08204132cdf75048284', // Bot
  ]);
  // Deploying StateRelayerProxy contract
  const stateRelayerProxy = await ethers.deployContract('StateRelayerProxy', [stateRelayerAddress, encodedData]);
  await stateRelayerProxy.deploymentTransaction()?.wait(5);
  const stateRelayerProxyAddress = await stateRelayerProxy.getAddress();
  console.log('State relayer proxy address: ', stateRelayerProxyAddress);
  console.log('Verifying........');
  await verify({
    contractAddress: stateRelayerProxyAddress,
    args: [stateRelayerAddress, encodedData],
    contract: 'contracts/StateRelayerProxy.sol:StateRelayerProxy',
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
