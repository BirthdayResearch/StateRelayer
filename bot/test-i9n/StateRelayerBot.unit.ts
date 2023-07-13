import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import {
  expectedBurnedInfo,
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
    const output = await handler({
      testGasCost: false,
      envNetwork: EnvironmentNetwork.LocalPlayground,
      urlNetwork: '',
      contractAddress: proxy.address,
      signer: bot,
    });

    if (output !== undefined) {
      const { dexInfoTxReceipt, masterDataTxReceipt, vaultTxReceipt, burnTxReceipt } = output;
      expect(dexInfoTxReceipt).toBeUndefined();
      expect(masterDataTxReceipt).toBeUndefined();
      expect(vaultTxReceipt).toBeUndefined();
      expect(burnTxReceipt).toBeUndefined();
    }

    const receivedBurnedInfo = await proxy.getBurnedInfo();
    expect(receivedBurnedInfo[1].fee.toString()).toEqual(expectedBurnedInfo.fee.toString());
    expect(receivedBurnedInfo[1].auction.toString()).toEqual(expectedBurnedInfo.auction);
    expect(receivedBurnedInfo[1].payback.toString()).toEqual(expectedBurnedInfo.payback);
    expect(receivedBurnedInfo[1].emission.toString()).toEqual(expectedBurnedInfo.emission);
    expect(receivedBurnedInfo[1].total.toString()).toEqual(expectedBurnedInfo.total);

    // Checking the /dex/dex-pair info
    const dETH = await proxy.getDexPairInfo('dETH-DFI');
    expect(dETH[1].primaryTokenPrice.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[0]);
    expect(dETH[1].volume24H.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[1]);
    expect(dETH[1].totalLiquidity.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[2]);
    expect(dETH[1].APR.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[3]);
    expect(dETH[1].firstTokenBalance.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[4]);
    expect(dETH[1].secondTokenBalance.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[5]);
    expect(dETH[1].rewards.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[6]);
    expect(dETH[1].commissions.toString()).toEqual(Object.values(expectedPairData['dETH-DFI'])[7]);

    // Checking the /dex/dex-pair info
    const dBTC = await proxy.getDexPairInfo('dBTC-DFI');
    expect(dBTC[1].primaryTokenPrice.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[0]);
    expect(dBTC[1].volume24H.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[1]);
    expect(dBTC[1].totalLiquidity.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[2]);
    expect(dBTC[1].APR.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[3]);
    expect(dBTC[1].firstTokenBalance.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[4]);
    expect(dBTC[1].secondTokenBalance.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[5]);
    expect(dBTC[1].rewards.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[6]);
    expect(dBTC[1].commissions.toString()).toEqual(Object.values(expectedPairData['dBTC-DFI'])[7]);

    // Checking /dex info
    const dex = await proxy.getDexInfo();
    expect(dex[2].toString()).toEqual(expectedDexInfo.totalValueLockInPoolPair);
    expect(dex[1].toString()).toEqual(expectedDexInfo.total24HVolume);

    // Checking MasterNode information
    const receivedMasterNodeData = await proxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].totalValueLockedInMasterNodes.toString()).toEqual(
      expectedMasterNodeData.totalValueLockedInMasterNodes,
    );
    expect(receivedMasterNodeData[1].zeroYearLocked.toString()).toEqual(expectedMasterNodeData.zeroYearLocked);
    expect(receivedMasterNodeData[1].fiveYearLocked.toString()).toEqual(expectedMasterNodeData.fiveYearLocked);
    expect(receivedMasterNodeData[1].tenYearLocked.toString()).toEqual(expectedMasterNodeData.tenYearLocked);

    // Checking VaultInfo
    const receivedVaultData = await proxy.getVaultInfo();
    expect(receivedVaultData[1].noOfVaults.toString()).toEqual(expectedVaultData.noOfVaults);
    expect(receivedVaultData[1].totalLoanValue.toString()).toEqual(expectedVaultData.totalLoanValue);
    expect(receivedVaultData[1].totalCollateralValue.toString()).toEqual(expectedVaultData.totalCollateralValue);
    expect(receivedVaultData[1].totalCollateralizationRatio.toString()).toEqual(
      expectedVaultData.totalCollateralizationRatio,
    );
    expect(receivedVaultData[1].activeAuctions.toString()).toEqual(expectedVaultData.activeAuctions);
  });
});
