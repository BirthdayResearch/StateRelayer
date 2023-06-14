import '@nomicfoundation/hardhat-toolbox';

import { HardhatUserConfig } from 'hardhat/config';

require('dotenv').config({
  path: '.env',
});

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    floopyTestnet: {
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
