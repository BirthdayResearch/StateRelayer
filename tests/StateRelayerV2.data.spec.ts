import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';

import { StateRelayerV2, StateRelayerV2__factory } from '../generated';
import { IStateRelayer } from '../generated/contracts/StateRelayerV2'
import { deployV2Contract } from './utils/deploymentV2';

type MasterNodeInformationStruct = IStateRelayer.MasterNodeInformationStruct;
type VaultGeneralInformation = IStateRelayer.VaultGeneralInformationStruct;
type DexInfo = IStateRelayer.DEXInfoStruct;
type OracleInfo = IStateRelayer.OracleInfoStruct;

describe('State relayer v2 contract data tests', () => {
  let stateRelayerV2Proxy: StateRelayerV2;
  let bot: SignerWithAddress;
  let user: SignerWithAddress;
  let admin: SignerWithAddress;

  before(async ()=> {
    ({ stateRelayerV2Proxy, admin, bot, user } = await loadFixture(deployV2Contract));
  })

  describe('Test update master node data', () => {
    it('Should successfully set master node data', async () => {
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(stateRelayerV2Proxy.connect(bot).updateMasterNodeInformation(masterNodeData)).to.emit(
        stateRelayerV2Proxy,
        'UpdateMasterNodeInformation',
      );
      const receivedMasterNodeData = await stateRelayerV2Proxy.getMasterNodeInfo();
      expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(
        stateRelayerV2Proxy.connect(user).updateMasterNodeInformation(masterNodeData),
      ).to.be.revertedWithCustomError(stateRelayerV2Proxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });
  });

  describe('Test update vault data', () => {
    it('Should successfully set vault node data', async () => {
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(stateRelayerV2Proxy.connect(bot).updateVaultGeneralInformation(vaultInformationData)).to.emit(
        stateRelayerV2Proxy,
        'UpdateVaultGeneralInformation',
      );
      const receivedVaultInformationData = await stateRelayerV2Proxy.getVaultInfo();
      expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(
        stateRelayerV2Proxy.connect(user).updateVaultGeneralInformation(vaultInformationData),
      ).to.be.revertedWithCustomError(stateRelayerV2Proxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });
  });

  describe('Test update dexs data ', () => {
    it('Should successfully set dexs data', async () => {
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
        stateRelayerV2Proxy.connect(bot).updateDEXInfo(symbols, dexsData, totalValueLockInPoolPair, total24HVolume),
      ).to.emit(stateRelayerV2Proxy, 'UpdateDEXInfo');
      // Getting ETH dex Data
      const receivedEThDexData = await stateRelayerV2Proxy.getDexPairInfo(symbols[0]);
      // Testing that the received is as expected as dexDataEth
      expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
      // Getting BTC dex Data
      const receivedBtcDexData = await stateRelayerV2Proxy.getDexPairInfo(symbols[1]);
      // Testing that the received is as expected as dexDataBtc
      expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {

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
        stateRelayerV2Proxy.connect(user).updateDEXInfo(['eth'], [dexDataEth], 1, 2),
      ).to.be.revertedWithCustomError(stateRelayerV2Proxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });

    it('Should successfully revert if there is a mismatch between the length of _dexInfo and _dex', async () => {
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
        stateRelayerV2Proxy.connect(bot).updateDEXInfo(symbols, dexsData, totalValueLockInPoolPair, total24HVolume),
      ).to.revertedWithCustomError(stateRelayerV2Proxy, 'DEX_AND_DEXINFO_NOT_HAVE_THE_SAME_LENGTH');
    });
  });

  describe('Test update oracle data ', () => {
    it('Should successfully set oracle data', async () => {
      const oracleDataEth: OracleInfo = {
        price: 111,
        tickerType: "CRYPTO",
        oraclesActive: 5,
        oraclesTotal: 13,
      };
      const oracleDataBtc: OracleInfo = {
        price: 222,
        tickerType: "CRYPTO",
        oraclesActive: 5,
        oraclesTotal: 13,
      };
      const oracleData: OracleInfo[] = [oracleDataEth, oracleDataBtc];
      const symbols: string[] = ['eth-usd', 'btc-usd'];
      await expect(
        stateRelayerV2Proxy.connect(bot).updateOracleInfo(symbols, oracleData),
      ).to.emit(stateRelayerV2Proxy, 'UpdateOracleInfo');
      // Getting ETH Oracle Data
      const receivedEThOracleData = await stateRelayerV2Proxy.getOraclePairInfo(symbols[0]);
      // Testing that the received is as expected as oracleDataEth
      expect(receivedEThOracleData[1].toString()).to.equal(Object.values(oracleDataEth).toString());
      // Getting BTC Oracle Data
      const receivedBtcOracleData = await stateRelayerV2Proxy.getOraclePairInfo(symbols[1]);
      // Testing that the received is as expected as oracleDataBtc
      expect(receivedBtcOracleData[1].toString()).to.equal(Object.values(oracleDataBtc).toString());
    });

    it('Should successfully revert if the signer is not `bot`', async () => {
      const oracleDataEth: OracleInfo = {
        price: 111,
        tickerType: "CRYPTO",
        oraclesActive: 5,
        oraclesTotal: 13,
      };
      await expect(
        stateRelayerV2Proxy.connect(user).updateOracleInfo(['eth-usd'], [oracleDataEth]),
      ).to.be.revertedWithCustomError(stateRelayerV2Proxy, 'NOT_BOT_ROLE_OR_NOT_IN_BATCH_CALL_IN_BOT');
    });

    it('Should successfully revert if there is a mismatch between the length of _oracleInfo and _oracle', async () => {
      const oracleDataEth: OracleInfo = {
        price: 111,
        tickerType: "CRYPTO",
        oraclesActive: 5,
        oraclesTotal: 13,
      };
      const oracleDataBtc: OracleInfo = {
        price: 222,
        tickerType: "CRYPTO",
        oraclesActive: 5,
        oraclesTotal: 13,
      };
      const oracleData: OracleInfo[] = [oracleDataEth, oracleDataBtc];
      const symbols: string[] = ['eth-usd', 'btc-usd', 'dfi-usd'];
      await expect(
        stateRelayerV2Proxy.connect(bot).updateOracleInfo(symbols, oracleData),
      ).to.revertedWithCustomError(stateRelayerV2Proxy, 'ORACLE_AND_ORACLEINFO_NOT_HAVE_THE_SAME_LENGTH');
    });
  });

  describe('Test batch call', () => {
    it('Should be able to update in batch ', async () => {
      // Master node data
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      const stateRelayerInterface = StateRelayerV2__factory.createInterface();
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

      const oracleDataEth: OracleInfo = {
        price: 12,
        tickerType: "CRYPTO",
        oraclesActive: 53,
        oraclesTotal: 113,
      };
      const oracleDataBtc: OracleInfo = {
        price: 212,
        tickerType: "CRYPTO",
        oraclesActive: 52,
        oraclesTotal: 123,
      };

      const oracleData: OracleInfo[] = [oracleDataEth, oracleDataBtc];
      const oracleSymbols: string[] = ['eth-usd', 'btc-usd'];
      const callDataForUpdatingOracleInfos = stateRelayerInterface.encodeFunctionData('updateOracleInfo', [
        oracleSymbols,
        oracleData
      ]);

      await stateRelayerV2Proxy
        .connect(bot)
        .batchCallByBot([
          callDataForUpdatingMasterNodeData,
          callDataForUpdatingVaultInformation,
          callDataForUpdatingDexInfos,
          callDataForUpdatingOracleInfos
        ]);
      const receivedMasterNodeData = await stateRelayerV2Proxy.getMasterNodeInfo();
      expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());
      const receivedVaultInformationData = await stateRelayerV2Proxy.getVaultInfo();
      expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());
      // Getting ETH dex Data
      const receivedEThDexData = await stateRelayerV2Proxy.getDexPairInfo(symbols[0]);
      // Testing that the received is as expected as dexDataEth
      expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
      // Getting BTC dex Data
      const receivedBtcDexData = await stateRelayerV2Proxy.getDexPairInfo(symbols[1]);
      // Testing that the received is as expected as dexDataBtc
      expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());

      // Getting ETH Oracle Data
      const receivedEThDexOracleData = await stateRelayerV2Proxy.getOraclePairInfo(oracleSymbols[0]);
      // Testing that the received is as expected as oracleDataEth
      expect(receivedEThDexOracleData[1].toString()).to.equal(Object.values(oracleDataEth).toString());
      // Getting BTC Oracle Data
      const receivedBtcOracleData = await stateRelayerV2Proxy.getOraclePairInfo(oracleSymbols[1]);
      // Testing that the received is as expected as oracleDataBtc
      expect(receivedBtcOracleData[1].toString()).to.equal(Object.values(oracleDataBtc).toString());
    });

    it('Should fail when the caller is not authorized ', async () => {

      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      const stateRelayerInterface = StateRelayerV2__factory.createInterface();
      const callDataForUpdatingMasterNodeData = stateRelayerInterface.encodeFunctionData(
        'updateMasterNodeInformation',
        [masterNodeData],
      );
      const botRole = await stateRelayerV2Proxy.BOT_ROLE();

      await expect(
        stateRelayerV2Proxy.connect(admin).batchCallByBot([callDataForUpdatingMasterNodeData]),
      ).to.revertedWith(`AccessControl: account ${admin.address.toLowerCase()} is missing role ${botRole}`);
    });

    it('Should fail when the batch call tries to use authorized function', async () => {

      const stateRelayerInterface = StateRelayerV2__factory.createInterface();
      const encodedGrantRole = stateRelayerInterface.encodeFunctionData('grantRole', [
        `0x${'0'.repeat(64)}`,
        bot.address,
      ]);
      await expect(stateRelayerV2Proxy.connect(bot).batchCallByBot([encodedGrantRole])).to.revertedWith(
        `AccessControl: account ${(await stateRelayerV2Proxy.getAddress()).toLowerCase()} is missing role 0x${'0'.repeat(
          64,
        )}`,
      );
    });

    it('Should fail when not granting state relayer the bot_role and then perform recursive batch call', async () => {

      const stateRelayerInterface = StateRelayerV2__factory.createInterface();
      const encodedGrantRole = stateRelayerInterface.encodeFunctionData('batchCallByBot', [
        [stateRelayerInterface.encodeFunctionData('BOT_ROLE')],
      ]);
      const botRole = await stateRelayerV2Proxy.BOT_ROLE();
      await expect(stateRelayerV2Proxy.connect(bot).batchCallByBot([encodedGrantRole])).to.revertedWith(
        `AccessControl: account ${(await stateRelayerV2Proxy.getAddress()).toLowerCase()} is missing role ${botRole}`,
      );
    });

    it('Return right error when not using the right call data', async () => {
      // check if 0xffffffff is among the signatures of the contract
      expect(StateRelayerV2__factory.createInterface().hasFunction('0xffffffff')).to.be.false;

      // use non-existent function signature
      await expect(stateRelayerV2Proxy.connect(bot).batchCallByBot(['0xffffffff'])).to.revertedWithCustomError(
        stateRelayerV2Proxy,
        'ERROR_IN_LOW_LEVEL_CALLS()',
      );
    });
  });
});
