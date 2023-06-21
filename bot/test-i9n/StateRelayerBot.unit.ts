import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import { expectedBurnedInfo, mockedDexPricesData, mockedPoolPairData, mockedStatsData } from '../utils/oceanMockedData';

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
    const receivedBurnedInfo = await proxy.burnedInfo();
    const {decimal} = receivedBurnedInfo;
    expect(receivedBurnedInfo.fee.div(10**decimal).toString()).toEqual(Math.floor(Number(expectedBurnedInfo.fee)).toString())
    expect(receivedBurnedInfo.auction.div(10**decimal).toString()).toEqual(Number(expectedBurnedInfo.auction).toFixed(0))
    expect(receivedBurnedInfo.payback.div(10**decimal).toString()).toEqual(Number(expectedBurnedInfo.payback).toFixed(0))
    expect(receivedBurnedInfo.emission.div(10**decimal).toString()).toEqual(Math.floor(Number(expectedBurnedInfo.emission)).toString())
    expect(receivedBurnedInfo.total.div(10**decimal).toString()).toEqual(Math.floor(Number(expectedBurnedInfo.total)).toString())
  });
});
