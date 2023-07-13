import { ethers } from 'hardhat';

import { StateRelayer__factory } from '../generated';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// If running below command, user needs to provide PRIVATE_KEY in .env file
// npx hardhat run --network DMCTestnet ./scripts/dataFeed.ts
// If running below command, run in the following steps. No need to provide PRIVATE_KEY in .env. Confirm the tx on: http://localhost:24012/rpcs (By default)
// npx truffle dashboard
// npx hardhat run --network truffleDashboard ./scripts/dataFeed.ts
async function dataFeed(contractAddress: string) {
  const [signers] = await ethers.getSigners();
  const provider = new ethers.providers.JsonRpcProvider('http://13.214.74.236:20551/');
  const stateContract = new ethers.Contract(contractAddress, StateRelayer__factory.abi, provider);
  const tx = await stateContract
    .connect(signers)
    .updateMasterNodeInformation(['1528620054717725800', '10636', '917', '3491', 18], { gasLimit: 100000 });
  await tx.wait();
}
const stateRelayerProxyAddress = '0xAE105DE0afC82f91ddBF97cf2197dbd4627a8D16';
dataFeed(stateRelayerProxyAddress).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
