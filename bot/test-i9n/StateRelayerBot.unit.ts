import { getWhaleClient } from '@waveshq/walletkit-bot';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';

import { HardhatNetwork, HardhatNetworkContainer, StartedHardhatNetworkContainer } from '../../containers';
import { StateRelayer, StateRelayer__factory, StateRelayerProxy__factory } from '../../generated';
import { handler } from '../StateRelayerBot';
import { tranformPairData } from '../utils/transformData';
import {
  expectedMasterNodeData,
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
  let admin: ethers.Signer;
  let bot: ethers.Signer;
  let proxy: StateRelayer;

  beforeEach(async () => {
    startedHardhatContainer = await new HardhatNetworkContainer()
      .withEnvironment({
        TRANSACTION_AUTOMINE: 'true',
      })
      .start();
    hardhatNetwork = await startedHardhatContainer.ready();
    const stateRelayerImplementation = await hardhatNetwork?.contracts?.deployContract({
      deploymentName: 'StateRelayerImplementation',
      contractName: 'StateRelayer',
      abi: StateRelayer__factory.abi,
    });
    admin = (await hardhatNetwork.getHardhatTestWallet(0)).testWalletSigner;
    bot = (await hardhatNetwork.getHardhatTestWallet(1)).testWalletSigner;
    const stateRelayerProxy = await hardhatNetwork?.contracts?.deployContract({
      deploymentName: 'StateRelayerProxy',
      contractName: 'StateRelayerProxy',
      abi: StateRelayerProxy__factory.abi,
      deployArgs: [
        await stateRelayerImplementation?.getAddress(),
        StateRelayer__factory.createInterface().encodeFunctionData('initialize', [
          await admin.getAddress(),
          await bot.getAddress(),
        ]),
      ],
    });
    proxy = StateRelayer__factory.connect((await stateRelayerProxy?.getAddress()) || '', bot);
  });

  afterEach(async () => {
    await hardhatNetwork.stop();
  });

  test('Successfully set the dexInfo data', async () => {
    const output = await handler({
      testGasCost: false,
      envNetwork: EnvironmentNetwork.LocalPlayground,
      urlNetwork: '',
      contractAddress: await proxy.getAddress(),
      signer: bot,
    });

    const client = getWhaleClient('', EnvironmentNetwork.LocalPlayground);
    const testPoolPairData = await client.poolpairs.list(200);
    if (output !== undefined) {
      const { dexInfoTxReceipt, masterDataTxReceipt, vaultTxReceipt } = output;
      expect(dexInfoTxReceipt).toBeUndefined();
      expect(masterDataTxReceipt).toBeUndefined();
      expect(vaultTxReceipt).toBeUndefined();
    }

    // Checking the /dex/dex-pair info
    const dETH = await proxy.getDexPairInfo('dETH-DFI');
    const expectedDexInfo = tranformPairData(testPoolPairData, mockedStatsData, mockedDexPricesData);
    const lastETHDFIInfo = expectedDexInfo.dexInfo[expectedDexInfo.dex.indexOf('dETH-DFI')];
    // for sure both two sides have the same type as bigint
    expect(dETH[1].primaryTokenPrice).toStrictEqual(Object.values(lastETHDFIInfo)[0]);
    expect(dETH[1].volume24H).toStrictEqual(Object.values(lastETHDFIInfo)[1]);
    expect(dETH[1].totalLiquidity).toStrictEqual(Object.values(lastETHDFIInfo)[2]);
    expect(dETH[1].APR).toStrictEqual(Object.values(lastETHDFIInfo)[3]);
    expect(dETH[1].firstTokenBalance).toStrictEqual(Object.values(lastETHDFIInfo)[4]);
    expect(dETH[1].secondTokenBalance).toStrictEqual(Object.values(lastETHDFIInfo)[5]);
    expect(dETH[1].rewards).toStrictEqual(Object.values(lastETHDFIInfo)[6]);
    expect(dETH[1].commissions).toStrictEqual(Object.values(lastETHDFIInfo)[7]);

    // Checking /dex info
    const dex = await proxy.getDexInfo();
    expect(dex[2]).toStrictEqual(expectedDexInfo.totalValueLocked);
    expect(dex[1]).toStrictEqual(expectedDexInfo.total24HVolume);

    // Checking MasterNode information
    const receivedMasterNodeData = await proxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].totalValueLockedInMasterNodes).toStrictEqual(
      expectedMasterNodeData.totalValueLockedInMasterNodes,
    );
    expect(receivedMasterNodeData[1].zeroYearLockedNoDecimals).toStrictEqual(
      expectedMasterNodeData.zeroYearLockedNoDecimals,
    );
    expect(receivedMasterNodeData[1].fiveYearLockedNoDecimals).toStrictEqual(
      expectedMasterNodeData.fiveYearLockedNoDecimals,
    );
    expect(receivedMasterNodeData[1].tenYearLockedNoDecimals).toStrictEqual(
      expectedMasterNodeData.tenYearLockedNoDecimals,
    );

    // Checking VaultInfo
    const receivedVaultData = await proxy.getVaultInfo();
    expect(receivedVaultData[1].noOfVaultsNoDecimals).toStrictEqual(expectedVaultData.noOfVaultsNoDecimals);
    expect(receivedVaultData[1].totalLoanValue).toStrictEqual(expectedVaultData.totalLoanValue);
    expect(receivedVaultData[1].totalCollateralValue).toStrictEqual(expectedVaultData.totalCollateralValue);
    expect(receivedVaultData[1].totalCollateralizationRatio).toStrictEqual(
      expectedVaultData.totalCollateralizationRatio,
    );
    expect(receivedVaultData[1].activeAuctionsNoDecimals).toStrictEqual(expectedVaultData.activeAuctionsNoDecimals);
  });
});
