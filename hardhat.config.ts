import '@nomicfoundation/hardhat-toolbox';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.18',
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
