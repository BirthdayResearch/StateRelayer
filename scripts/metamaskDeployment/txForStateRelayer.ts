import { ethers } from 'hardhat';

async function main() {
  const data = (await (await ethers.getContractFactory('StateRelayer')).getDeployTransaction()).data;
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
                data: '${data}'
            } ]})
    `,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
