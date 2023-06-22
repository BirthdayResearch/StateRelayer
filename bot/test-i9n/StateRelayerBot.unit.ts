import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import {
  expectedDexInfo,
  expectedMasterNodeData,
  expectedPairData,
  expectedVaultData,
  mockedDexPricesData,
  mockedPoolPairData,
  mockedStatsData,
} from './mockData/oceanMockedData';

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

  test('Successfully set the dexInfo data', async () => {
    await handler({
      envNetwork: EnvironmentNetwork.LocalPlayground,
      urlNetwork: '',
      contractAddress: proxy.address,
      signer: bot,
    });

    // Checking the /dex/dex-pair info
    const dETH = await proxy.DEXInfoMapping('dETH-DFI');
    expect(dETH.primaryTokenPrice.toString()).toEqual(
      (Object.values(expectedPairData['dETH-DFI'])[0]))
    expect(dETH.volume24H.toString()).toEqual(
      (Object.values(expectedPairData['dETH-DFI'])[1]))
    expect(dETH.totalLiquidity.toString()).toEqual(
      (Object.values(expectedPairData['dETH-DFI'])[2]))
    expect((dETH.APR.toNumber()).toString()).toEqual(
      (Object.values(expectedPairData['dETH-DFI'])[3])
    );

    // Checking /dex info
    const dex = await proxy.getDexInfo();
    expect(dex[0].toString()).toEqual(expectedDexInfo.totalValueLockInPoolPair)
    expect(dex[1].toString()).toEqual(expectedDexInfo.total24HVolume)

    // Checking MasterNode information
    const receivedMasterNodeData = await proxy.masterNodeInformation();
    expect(receivedMasterNodeData.totalValueLockedInMasterNodes.toString()).toEqual(
      expectedMasterNodeData.totalValueLockedInMasterNodes,
    );
    expect(receivedMasterNodeData.zeroYearLocked.toString()).toEqual(
      expectedMasterNodeData.zeroYearLocked,
    );
    expect(receivedMasterNodeData.fiveYearLocked.toString()).toEqual(
      expectedMasterNodeData.fiveYearLocked,
    );
    expect(receivedMasterNodeData.tenYearLocked.toString()).toEqual(
      expectedMasterNodeData.tenYearLocked)

    // Checking VaultInfo
    const receivedVaultData = await proxy.vaultInfo();
    expect(receivedVaultData.noOfVaults.toString()).toEqual(expectedVaultData.noOfVaults);
    expect(receivedVaultData.totalLoanValue.toString()).toEqual(
      expectedVaultData.totalLoanValue,
    );
    expect(receivedVaultData.totalCollateralValue.toString()).toEqual(
      expectedVaultData.totalCollateralValue,
    );
    expect(receivedVaultData.totalCollateralizationRatio.toString()).toEqual(
      expectedVaultData.totalCollateralizationRatio,
    );
    expect(receivedVaultData.activeAuctions.toString()).toEqual(expectedVaultData.activeAuctions);

  })
});
