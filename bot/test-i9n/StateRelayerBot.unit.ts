import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import { mockedDexPricesData, mockedPoolPairData, mockedStatsData } from '../utils/oceanMockedData';

jest.mock('@defichain/whale-api-client', () => ({
  WhaleApiClient: jest.fn().mockImplementation(() => ({
    stats: {
      get: () => mockedStatsData,
    },
    poolpairs: {
      list: () => mockedPoolPairData,
      listDexPrices: () => mockedDexPricesData,
    },
  })),
}));

describe('State Relayer Bot Tests', () => {
  let startedHardhatContainer: StartedHardhatNetworkContainer;
  let hardhatNetwork: HardhatNetwork;
  let admin: ethers.providers.JsonRpcSigner;
  let bot: ethers.providers.JsonRpcSigner;
  let proxy: StateRelayer;

  beforeEach(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer()
      .withEnvironment({
        TRANSACTION_AUTOMINE: 'true',
      })
      .start();
    hardhatNetwork = await startedHardhatContainer.ready();
    const stateRelayerImplementation = await hardhatNetwork.contracts.deployContract({
      deploymentName: 'StateRelayerImplementation',
      contractName: 'StateRelayer',
      abi: StateRelayer__factory.abi,
    });
    admin = hardhatNetwork.getHardhatTestWallet(0).testWalletSigner;
    bot = hardhatNetwork.getHardhatTestWallet(1).testWalletSigner;
    const stateRelayerProxy = await hardhatNetwork.contracts.deployContract({
      deploymentName: 'StateRelayerProxy',
      contractName: 'StateRelayerProxy',
      abi: StateRelayerProxy__factory.abi,
      deployArgs: [
        stateRelayerImplementation.address,
        StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
          await admin.getAddress(),
          await bot.getAddress(),
        ]),
      ],
    });
    proxy = StateRelayer__factory.connect(stateRelayerProxy.address, bot);
  });

  afterEach(async () => {
    await hardhatNetwork.stop();
  });

  test('should check that data is parsed correctly', async () => {
    await handler({
      envNetwork: EnvironmentNetwork.LocalPlayground,
      urlNetwork: '',
      contractAddress: proxy.address,
      signer: bot,
    });
    console.log(await proxy.DEXInfoMapping('dETH-DFI'));
  });
});
