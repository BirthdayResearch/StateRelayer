import { ethers } from 'hardhat';
import { StateRelayer__factory } from '../generated';

async function main() {
  const stateRelayerAddress = ethers.getCreateAddress({
    // replace with the correct address and nonce here
    from: '',
    nonce: 0,
  });
  const initializeEncodeFunction = StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
    // replace with the correct admin address and bot address
    '', // Admin
    '', // Bot
  ]);
  const txData = (
    await (
      await ethers.getContractFactory('StateRelayerProxy')
    ).getDeployTransaction(stateRelayerAddress, initializeEncodeFunction)
  ).data;
  console.log(
    `let account;
     ethereum.request({ method: 'eth_requestAccounts' }).then(res => {account = res[0]}).then(() => console.log(account))
    `,
  );
  console.log(
    `ethereum.request({
        method: 'eth_sendTransaction',
        params: [
            { 
                from: account,
                data: '${txData}' 
            } ]})
    `,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
