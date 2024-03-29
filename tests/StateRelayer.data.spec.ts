import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';

import { StateRelayer, IStateRelayer, StateRelayer__factory } from '../generated';
import { deployContract } from './utils/deployment';

type MasterNodeInformationStruct = IStateRelayer.MasterNodeInformationStruct;
type VaultGeneralInformation = IStateRelayer.VaultGeneralInformationStruct;
type DexInfo = IStateRelayer.DEXInfoStruct;

describe('State relayer contract data tests', () => {
  let stateRelayerProxy: StateRelayer;
  let bot: SignerWithAddress;
  let user: SignerWithAddress;
  let admin: SignerWithAddress;

  describe('Test update master node data', () => {
    it('Should successfully set master node data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(stateRelayerProxy.connect(bot).updateMasterNodeInformation(masterNodeData)).to.emit(
        stateRelayerProxy,
        'UpdateMasterNodeInformation',
      );
      const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
      expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(
        stateRelayerProxy.connect(user).updateMasterNodeInformation(masterNodeData),
      ).to.be.revertedWithCustomError(stateRelayerProxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });
  });

  describe('Test update vault data', () => {
    it('Should successfully set vault node data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(stateRelayerProxy.connect(bot).updateVaultGeneralInformation(vaultInformationData)).to.emit(
        stateRelayerProxy,
        'UpdateVaultGeneralInformation',
      );
      const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
      expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(
        stateRelayerProxy.connect(user).updateVaultGeneralInformation(vaultInformationData),
      ).to.be.revertedWithCustomError(stateRelayerProxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });
  });

  describe('Test update dexs data ', () => {
    it('Should successfully set dexs data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const totalValueLockInPoolPair = 76354685;
      const total24HVolume = 65738274;
      const dexDataEth: DexInfo = {
        primaryTokenPrice: 113,
        volume24H: 102021,
        totalLiquidity: 2164,
        APR: 14,
        firstTokenBalance: 31269,
        secondTokenBalance: 2314,
        rewards: 124,
        commissions: 3,
      };
      const dexDataBtc: DexInfo = {
        primaryTokenPrice: 112,
        volume24H: 102020,
        totalLiquidity: 2163,
        APR: 12,
        firstTokenBalance: 31265,
        secondTokenBalance: 2312,
        rewards: 123,
        commissions: 2,
      };
      const dexsData: DexInfo[] = [dexDataEth, dexDataBtc];
      const symbols: string[] = ['eth', 'btc'];
      await expect(
        stateRelayerProxy.connect(bot).updateDEXInfo(symbols, dexsData, totalValueLockInPoolPair, total24HVolume),
      ).to.emit(stateRelayerProxy, 'UpdateDEXInfo');
      // Getting ETH dex Data
      const receivedEThDexData = await stateRelayerProxy.getDexPairInfo(symbols[0]);
      // Testing that the received is as expected as dexDataEth
      expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
      // Getting BTC dex Data
      const receivedBtcDexData = await stateRelayerProxy.getDexPairInfo(symbols[1]);
      // Testing that the received is as expected as dexDataBtc
      expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));

      const dexDataEth: DexInfo = {
        primaryTokenPrice: 113,
        volume24H: 102021,
        totalLiquidity: 2164,
        APR: 14,
        firstTokenBalance: 31269,
        secondTokenBalance: 2314,
        rewards: 124,
        commissions: 3,
      };
      await expect(
        stateRelayerProxy.connect(user).updateDEXInfo(['eth'], [dexDataEth], 1, 2),
      ).to.be.revertedWithCustomError(stateRelayerProxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });

    it('Should successfully revert if there is a mismatch between the length of _dexInfo and _dex', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const totalValueLockInPoolPair = 76354685;
      const total24HVolume = 65738274;
      const dexDataEth: DexInfo = {
        primaryTokenPrice: 113,
        volume24H: 102021,
        totalLiquidity: 2164,
        APR: 14,
        firstTokenBalance: 31269,
        secondTokenBalance: 2314,
        rewards: 124,
        commissions: 3,
      };
      const dexDataBtc: DexInfo = {
        primaryTokenPrice: 112,
        volume24H: 102020,
        totalLiquidity: 2163,
        APR: 12,
        firstTokenBalance: 31265,
        secondTokenBalance: 2312,
        rewards: 123,
        commissions: 2,
      };
      const dexsData: DexInfo[] = [dexDataEth, dexDataBtc];
      const symbols: string[] = ['eth', 'btc', 'dfi'];
      await expect(
        stateRelayerProxy.connect(bot).updateDEXInfo(symbols, dexsData, totalValueLockInPoolPair, total24HVolume),
      ).to.revertedWithCustomError(stateRelayerProxy, 'DEX_AND_DEXINFO_NOT_HAVE_THE_SAME_LENGTH');
    });
  });

  describe('Test batch call', () => {
    it('Should be able to update in batch ', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      // Master node data
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      const stateRelayerInterface = StateRelayer__factory.createInterface();
      const callDataForUpdatingMasterNodeData = stateRelayerInterface.encodeFunctionData(
        'updateMasterNodeInformation',
        [masterNodeData],
      );
      // Vault information data
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      const callDataForUpdatingVaultInformation = stateRelayerInterface.encodeFunctionData(
        'updateVaultGeneralInformation',
        [vaultInformationData],
      );

      // Dex info data
      const dexDataEth: DexInfo = {
        primaryTokenPrice: 113,
        volume24H: 102021,
        totalLiquidity: 2164,
        APR: 14,
        firstTokenBalance: 31269,
        secondTokenBalance: 2314,
        rewards: 124,
        commissions: 3,
      };
      const dexDataBtc: DexInfo = {
        primaryTokenPrice: 112,
        volume24H: 102020,
        totalLiquidity: 2163,
        APR: 12,
        firstTokenBalance: 31265,
        secondTokenBalance: 2312,
        rewards: 123,
        commissions: 2,
      };
      const dexsData: DexInfo[] = [dexDataEth, dexDataBtc];
      const symbols: string[] = ['eth', 'btc'];
      const callDataForUpdatingDexInfos = stateRelayerInterface.encodeFunctionData('updateDEXInfo', [
        symbols,
        dexsData,
        1,
        2,
      ]);

      await stateRelayerProxy
        .connect(bot)
        .batchCallByBot([
          callDataForUpdatingMasterNodeData,
          callDataForUpdatingVaultInformation,
          callDataForUpdatingDexInfos,
        ]);
      const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
      expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());
      const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
      expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());
      // Getting ETH dex Data
      const receivedEThDexData = await stateRelayerProxy.getDexPairInfo(symbols[0]);
      // Testing that the received is as expected as dexDataEth
      expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
      // Getting BTC dex Data
      const receivedBtcDexData = await stateRelayerProxy.getDexPairInfo(symbols[1]);
      // Testing that the received is as expected as dexDataBtc
      expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());
    });

    it('Should fail when the caller is not authorized ', async () => {
      ({ stateRelayerProxy, admin } = await loadFixture(deployContract));

      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      const stateRelayerInterface = StateRelayer__factory.createInterface();
      const callDataForUpdatingMasterNodeData = stateRelayerInterface.encodeFunctionData(
        'updateMasterNodeInformation',
        [masterNodeData],
      );
      const botRole = await stateRelayerProxy.BOT_ROLE();

      await expect(
        stateRelayerProxy.connect(admin).batchCallByBot([callDataForUpdatingMasterNodeData]),
      ).to.revertedWith(`AccessControl: account ${admin.address.toLowerCase()} is missing role ${botRole}`);
    });

    it('Should fail when the batch call tries to use authorized function', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));

      const stateRelayerInterface = StateRelayer__factory.createInterface();
      const encodedGrantRole = stateRelayerInterface.encodeFunctionData('grantRole', [
        `0x${'0'.repeat(64)}`,
        bot.address,
      ]);
      await expect(stateRelayerProxy.connect(bot).batchCallByBot([encodedGrantRole])).to.revertedWith(
        `AccessControl: account ${(await stateRelayerProxy.getAddress()).toLowerCase()} is missing role 0x${'0'.repeat(
          64,
        )}`,
      );
    });

    it('Should fail when not granting state relayer the bot_role and then perform recursive batch call', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));

      const stateRelayerInterface = StateRelayer__factory.createInterface();
      const encodedGrantRole = stateRelayerInterface.encodeFunctionData('batchCallByBot', [
        [stateRelayerInterface.encodeFunctionData('BOT_ROLE')],
      ]);
      const botRole = await stateRelayerProxy.BOT_ROLE();
      await expect(stateRelayerProxy.connect(bot).batchCallByBot([encodedGrantRole])).to.revertedWith(
        `AccessControl: account ${(await stateRelayerProxy.getAddress()).toLowerCase()} is missing role ${botRole}`,
      );
    });

    it('Return right error when not using the right call data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      // check if 0xffffffff is among the signatures of the contract
      expect(StateRelayer__factory.createInterface().hasFunction('0xffffffff')).to.be.false;

      // use non-existent function signature
      await expect(stateRelayerProxy.connect(bot).batchCallByBot(['0xffffffff'])).to.revertedWithCustomError(
        stateRelayerProxy,
        'ERROR_IN_LOW_LEVEL_CALLS()',
      );
    });
  });
});
