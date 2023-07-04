import { ethers } from 'hardhat';

import { MockRelayer__factory, StateRelayer__factory } from '../generated';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// To deploy Smart contract without providing private keys in evn. Below uses the truffle dashboard with metamask.
// npx hardhat run --network truffleDashboard ./scripts/dataFeed.ts
async function dataFeed(contractAddress?: string) {
  const [signers] = await ethers.getSigners();
  const provider = new ethers.providers.JsonRpcProvider('http://35.187.53.161:20551');
  const stateContract = new ethers.Contract(contractAddress, MockRelayer__factory.abi, provider);
  console.log(await stateContract.connect(signers).updateState(1));
  // const mockContract = new ethers.Contract(contractAddress, MockContract__factory.abi, provider);
  // await mockContract.connect(signers).updateState(2);
}
const mockContractAddress = '0xd846F585fB2d598279071d9dad768E8e2aB01296';
const stateRelayerProxyAddress = '0xcf46184A1dB0dB31b05d42Cba17a2389f969Db72';
dataFeed(stateRelayerProxyAddress).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
