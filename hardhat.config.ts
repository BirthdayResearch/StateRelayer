import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ledger';

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

require('dotenv').config({
  path: '.env',
});

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
      console.log(`${await contract.getAddress()} ${contract.deploymentTransaction()?.hash}`);
    } catch (e) {
      // Logs the error message to be picked up by the caller. Errors start with 'Error: ...'
      console.log(e);
    }
  });

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  typechain: {
    outDir: './generated',
    target: 'ethers-v6',
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    artifacts: './artifacts',
    cache: './cache',
  },
  networks: {
    hardhat: {
      chainId: DEFAULT_CHAINID,
      // To enable/disable auto-mining at runtime, refer to:
      // https://hardhat.org/hardhat-network/docs/explanation/mining-modes#using-rpc-methods
      mining: {
        auto: (process.env[TX_AUTOMINE_ENV_VAR] ?? 'true').toLowerCase() === 'true',
        interval: Number(process.env[TX_AUTOMINE_INTERVAL_ENV_VAR] ?? 0),
      },
      // We need to allow large contract sizes since contract sizes
      // could be larger than the stipulated max size in EIP-170
      allowUnlimitedContractSize: true,
    },
    DMCTestnet: {
      url: 'https://testnet-dmc.mydefichain.com:20551/',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      // ledgerAccounts: ['first EVM address of your ledger'],
      chainId: 1133,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      DMCTestnet: 'abc',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'DMCTestnet',
        chainId: 1133,
        urls: {
          apiURL: 'https://testnet-dmc.mydefichain.com:8444/api',
          browserURL: 'https://testnet-dmc.mydefichain.com:8444',
        },
      },
    ],
  },
};

export default config;
