import { ethers } from 'hardhat';

import { StateRelayerV2__factory } from '../generated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verify } from './utils/verify';

const stateRelayerProxyAddress = "0x476595db4B137910479501834775AadcE1934354"; // Pre-deployed proxy contract address
// npx hardhat run --network DMCTestnet ./scripts/deploymentV2.ts
// To deploy Smart contract without providing private keys in evn. Below uses the truffle dashboard with metamask.
// If running below command, run in the following steps. Confirm the tx on: http://localhost:24012/rpcs (By default)
// npx truffle dashboard
// npx hardhat run --network truffleDashboard ./scripts/deploymentV2.ts
async function main() {
  const stateRelayerV2 = await ethers.deployContract('StateRelayerV2');
  await stateRelayerV2.deploymentTransaction()?.wait(5);
  const stateRelayerV2Address = await stateRelayerV2.getAddress();
  console.log('State relayer V2 Contract address: ', stateRelayerV2Address);
  console.log('Verifying........');
  await verify({ contractAddress: stateRelayerV2Address, contract: 'contracts/StateRelayerV2.sol:StateRelayerV2' });
  // Data to pass to proxy contract
  const encodedData = StateRelayerV2__factory.createInterface().encodeFunctionData('initialize', [
    2
  ]);
  // Get StateRelayerProxy contract
  const stateRelayerProxy  = await ethers.getContractAt('StateRelayer', stateRelayerProxyAddress);

  // Upgrading the Proxy contract to V2
  await stateRelayerProxy.upgradeToAndCall(stateRelayerV2Address, encodedData)

  console.log('State relayer proxy address: ', stateRelayerProxyAddress);
  console.log('Verifying........');
  await verify({
    contractAddress: stateRelayerProxyAddress,
    args: [stateRelayerV2Address, encodedData],
    contract: 'contracts/StateRelayerProxy.sol:StateRelayerProxy',
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
