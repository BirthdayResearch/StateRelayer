import '@nomicfoundation/hardhat-toolbox';

import { HardhatUserConfig, task, types } from 'hardhat/config';

// Default chainId for local testing purposes. Most local testnets (Ganache, etc) use this chainId
export const DEFAULT_CHAINID = 1337;
export const TX_AUTOMINE_ENV_VAR = 'TRANSACTION_AUTOMINE';
export const TX_AUTOMINE_INTERVAL_ENV_VAR = 'TRANSACTION_AUTOMINE_INTERVAL';

interface DeployContractArgs {
  name: string;
  deployargs: string | undefined;
  libraries: Record<string, string>;
}

task('deployContract', 'Deploys a contract based on the name of the contract')
  .addParam(
    'name',
    'The contract name. If the contract is Foo.sol, the contract name is Foo.',
    // no default value
    undefined,
    types.string,
  )
  .addOptionalParam(
    'deployargs',
    'Comma-delimited contract deployment arguments. If empty, there are no necessary deployment args.',
    // no default value
    undefined,
    types.string,
  )
  .addOptionalParam(
    'libraries',
    'Link a contract to a deployed library. Expects a JSON of library name to address.',
    undefined,
    types.json,
  )
  .setAction(async (taskArgs: DeployContractArgs, hre) => {
    try {
      const { name, deployargs, libraries } = taskArgs;

      const contractFactory = await hre.ethers.getContractFactory(name, {
        libraries,
      });
      const contract = await contractFactory.deploy(...(deployargs === undefined ? [] : deployargs.split(',')));

      // Logs the contract address as the output of this task
      // Can be picked up by the task executor to create a contract instance with the outputted contract address
      console.log(`${contract.address} ${contract.deployTransaction.hash}`);
    } catch (e) {
      // Logs the error message to be picked up by the caller. Errors start with 'Error: ...'
      console.log(e);
    }
  });

require('dotenv').config({
  path: '.env',
});

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    testnet: {
      url: 'http://35.187.53.161:20551',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 1133,
    },
  },
  typechain: {
    outDir: './generated',
    target: 'ethers-v5',
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    artifacts: './artifacts',
    cache: './cache',
  },
};

export default config;
