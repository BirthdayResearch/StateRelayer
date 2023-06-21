import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import {
  expectedPairData,
  mockedDexPricesData,
  mockedMasterNodeData,
  mockedPoolPairData,
  mockedStatsData,
  mockedVaultData,
} from '../utils/oceanMockedData';

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

    // Checking the dex info
    const dETH = await proxy.DEXInfoMapping('dETH-DFI');
    expect(dETH.primaryTokenPrice.div(10 ** dETH.decimal).toString()).toEqual(
      Number(Object.values(expectedPairData['dETH-DFI'])[0]).toFixed(0),
    );
    expect(dETH.volume24H.div(10 ** dETH.decimal).toString()).toEqual(
      Number(Object.values(expectedPairData['dETH-DFI'])[1]).toFixed(0),
    );
    expect(dETH.totalLiquidity.div(10 ** dETH.decimal).toString()).toEqual(
      Number(Object.values(expectedPairData['dETH-DFI'])[2]).toFixed(0),
    );
    expect((dETH.APR.toNumber() / 10 ** dETH.decimal).toFixed(5).toString()).toEqual(
      Number(Object.values(expectedPairData['dETH-DFI'])[3]).toFixed(5),
    );

    // Checking VaultInfo
    const receivedVaultData = await proxy.vaultInfo();
    expect(receivedVaultData.noOfVaults.toString()).toEqual(mockedVaultData.noOfVaults);
    expect(receivedVaultData.totalLoanValue.div(10 ** receivedVaultData.decimal).toString()).toEqual(
      Number(mockedVaultData.totalLoanValue).toFixed(0),
    );
    expect(receivedVaultData.totalCollateralValue.div(10 ** receivedVaultData.decimal).toString()).toEqual(
      Math.floor(Number(mockedVaultData.totalCollateralValue)).toString(),
    );
    expect(receivedVaultData.totalCollateralizationRatio.toString()).toEqual(
      mockedVaultData.totalCollateralizationRatio,
    );
    expect(receivedVaultData.activeAuctions.toString()).toEqual(mockedVaultData.activeAuctions);

    // Checking MasterNode information
    const receivedMasterNodeData = await proxy.masterNodeInformation();
    expect(receivedMasterNodeData.tvl.div(10 ** receivedMasterNodeData.decimal).toString()).toEqual(
      Number(mockedMasterNodeData.totalValueLockedInMasterNodes).toFixed(0),
    );
    expect(receivedMasterNodeData.zeroYearTVL.div(10 ** receivedMasterNodeData.decimal).toString()).toEqual(
      Math.floor(Number(mockedMasterNodeData.zeroYearLocked)).toString(),
    );
    expect(receivedMasterNodeData.fiveYearTVL.div(10 ** receivedMasterNodeData.decimal).toString()).toEqual(
      Math.floor(Number(mockedMasterNodeData.fiveYearLocked)).toString(),
    );
    expect(receivedMasterNodeData.tenYearTVL.div(10 ** receivedMasterNodeData.decimal).toString()).toEqual(
      Number(mockedMasterNodeData.tenYearLocked).toFixed(0),
    );
  });
});
