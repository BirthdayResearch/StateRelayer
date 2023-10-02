import { StateRelayer__factory } from '../generated';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { verify } from './utils/verify';

async function main() {
  const stateRelayerAddress = '';
  console.log('Verifying........');
  await verify({ contractAddress: stateRelayerAddress, contract: 'contracts/StateRelayer.sol:StateRelayer' });
  // Data to pass to proxy contract
  const encodedData = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    '', // Admin
    '', // Bot
  ]);

  const stateRelayerProxyAddress = '';
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
