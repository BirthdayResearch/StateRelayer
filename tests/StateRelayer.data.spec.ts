import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

import { StateRelayer, StateRelayer__factory } from '../generated';
import { deployContract } from './utils/deployment';

type MasterNodeInformationStruct = StateRelayer.MasterNodeInformationStruct;
type VaultGeneralInformation = StateRelayer.VaultGeneralInformationStruct;
type DexInfo = StateRelayer.DEXInfoStruct;
type BurnedInfo = StateRelayer.BurnedInformationStruct;

describe('State relayer contract data tests', () => {
  let stateRelayerProxy: StateRelayer;
  let bot: SignerWithAddress;
  let user: SignerWithAddress;
  let admin: SignerWithAddress;

  describe('Successfully updating individually ', () => {
    it('Should successfully set master node data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(stateRelayerProxy.connect(bot).updateMasterNodeInformation(masterNodeData))
        .to.emit(stateRelayerProxy, 'UpdateMasterNodeInformation')
        .withArgs(Object.values(masterNodeData), (await time.latest()) + 1);
      const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
      expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());
    });

    it('Should successfully set vault node data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(stateRelayerProxy.connect(bot).updateVaultGeneralInformation(vaultInformationData))
        .to.emit(stateRelayerProxy, 'UpdateVaultGeneralInformation')
        .withArgs(Object.values(vaultInformationData), (await time.latest()) + 1);
      const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
      expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());
    });

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

    it('Should successfully set burned data for all ecosystem', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const burnInfo: BurnedInfo = {
        addr: '0xab',
        amount: 0,
        auction: [{ amount: 1, token: 'A' }],
        feeburn: 0,
        emissionburn: 0,
        auctionburn: 0,
        paybackburn: 0,
        paybackburntokens: [{ amount: 1, token: 'B' }],
        dexfeetokens: [{ amount: 1, token: 'X' }],
        dfipaybackfee: 0,
        dfipaybacktokens: [{ amount: 1, token: 'C' }],
        paybackfees: [{ amount: 1, token: 'D' }],
        paybacktokens: [{ amount: 1, token: 'D' }],
        dfip2203: [{ amount: 1, token: 'D' }],
        dfip2206f: [{ amount: 1, token: 'Z' }],
      };
      await stateRelayerProxy.connect(bot).updateBurnInfo(burnInfo);
      const receivedBurnedData = await stateRelayerProxy.getBurnedInfo();
      const fieldWithValues = [
        'addr',
        'amount',
        'feeburn',
        'emissionburn',
        'auctionburn',
        'paybackburn',
        'dfipaybackfee',
      ];
      // const indexInReceivedBurnInfo: number = -1;
      // reference on order of iteration
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys#description
      // https://stackoverflow.com/questions/29477973/does-for-of-loop-iteration-follow-the-array-order-in-javascript
      for (const k of Object.keys(burnInfo)) {
        if (k in fieldWithValues) {
          expect(receivedBurnedData[1][k]).to.equal(burnInfo[k]);
        } else {
          const amountTokenArr = receivedBurnedData[1][k];
          expect(amountTokenArr.length).to.equal(burnInfo[k].length);
          for (let index = 0; index < amountTokenArr.length; index += 1) {
            expect(amountTokenArr[index].amount).to.equal(burnInfo[k][index].amount);
            expect(amountTokenArr[index].token).to.equal(burnInfo[k][index].token);
          }
        }
      }
    });
  });

  describe('Unsuccessfully updating individually', () => {
    // These tests should fail as the signer does not have the `BOT_ROLE` assigned.
    // Only addresses with role assigned as `BOT_ROLE` can perform the updates.

    it('`updateMasterNodeInformation` - Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const masterNodeData: MasterNodeInformationStruct = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLockedNoDecimals: 101,
        fiveYearLockedNoDecimals: 102,
        tenYearLockedNoDecimals: 103,
      };
      await expect(stateRelayerProxy.connect(user).updateMasterNodeInformation(masterNodeData)).to.be.reverted;
    });

    it('`updateVaultGeneralInformation` - Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaultsNoDecimals: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctionsNoDecimals: 23,
      };
      await expect(stateRelayerProxy.connect(user).updateVaultGeneralInformation(vaultInformationData)).to.be.reverted;
    });

    it('`updateDEXInfo` - Should successfully revert if the signer is not `bot`', async () => {
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
      await expect(stateRelayerProxy.connect(user).updateDEXInfo(['eth'], [dexDataEth], 1, 2)).to.be.reverted;
    });

    it('`updateBurnInfo` - Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const burnInfo: BurnedInfo = {
        addr: '0xab',
        amount: 0,
        auction: [{ amount: 1, token: 'A' }],
        feeburn: 0,
        emissionburn: 0,
        auctionburn: 0,
        paybackburn: 0,
        paybackburntokens: [{ amount: 1, token: 'B' }],
        dexfeetokens: [{ amount: 1, token: 'X' }],
        dfipaybackfee: 0,
        dfipaybacktokens: [{ amount: 1, token: 'C' }],
        paybackfees: [{ amount: 1, token: 'D' }],
        paybacktokens: [{ amount: 1, token: 'D' }],
        dfip2203: [{ amount: 1, token: 'D' }],
        dfip2206f: [{ amount: 1, token: 'Z' }],
      };
      await expect(stateRelayerProxy.connect(user).updateBurnInfo(burnInfo)).to.reverted;
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

      // Burned info data
      const burnedData: BurnedInfo = {
        addr: '0xab',
        amount: 0,
        auction: [{ amount: 1, token: 'A' }],
        feeburn: 0,
        emissionburn: 0,
        auctionburn: 0,
        paybackburn: 0,
        paybackburntokens: [{ amount: 1, token: 'B' }],
        dexfeetokens: [{ amount: 1, token: 'X' }],
        dfipaybackfee: 0,
        dfipaybacktokens: [{ amount: 1, token: 'C' }],
        paybackfees: [{ amount: 1, token: 'D' }],
        paybacktokens: [{ amount: 1, token: 'D' }],
        dfip2203: [{ amount: 1, token: 'D' }],
        dfip2206f: [{ amount: 1, token: 'Z' }],
      };

      const callDataBurnedInfo = stateRelayerInterface.encodeFunctionData('updateBurnInfo', [burnedData]);
      await stateRelayerProxy
        .connect(bot)
        .batchCallByBot([
          callDataForUpdatingMasterNodeData,
          callDataForUpdatingVaultInformation,
          callDataForUpdatingDexInfos,
          callDataBurnedInfo,
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
      // Testing that the received is as expected as burnedData
      const receivedBurnedData = await stateRelayerProxy.getBurnedInfo();
      const fieldWithValues = [
        'addr',
        'amount',
        'feeburn',
        'emissionburn',
        'auctionburn',
        'paybackburn',
        'dfipaybackfee',
      ];
      for (const k of Object.keys(burnedData)) {
        if (k in fieldWithValues) {
          expect(receivedBurnedData[1][k]).to.equal(burnedData[k]);
        } else {
          const amountTokenArr = receivedBurnedData[1][k];
          expect(amountTokenArr.length).to.equal(burnedData[k].length);
          for (let index = 0; index < amountTokenArr.length; index += 1) {
            expect(amountTokenArr[index].amount).to.equal(burnedData[k][index].amount);
            expect(amountTokenArr[index].token).to.equal(burnedData[k][index].token);
          }
        }
      }
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
        `AccessControl: account ${stateRelayerProxy.address.toLowerCase()} is missing role 0x${'0'.repeat(64)}`,
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
        `AccessControl: account ${stateRelayerProxy.address.toLowerCase()} is missing role ${botRole}`,
      );
    });

    // This is to check whether the sanity works, in reality, NEVER GRANT THE SMART CONTRACT STATE RELAYER PROXY any role
    it('Should fail when granting state relayer the bot_role and then doing recursive batch calls', async () => {
      ({ stateRelayerProxy, bot, admin } = await loadFixture(deployContract));
      const botRole = await stateRelayerProxy.BOT_ROLE();
      await stateRelayerProxy.connect(admin).grantRole(botRole, stateRelayerProxy.address);
      const stateRelayerInterface = StateRelayer__factory.createInterface();
      const encodedGrantRole = stateRelayerInterface.encodeFunctionData('batchCallByBot', [
        [stateRelayerInterface.encodeFunctionData('BOT_ROLE')],
      ]);
      await expect(stateRelayerProxy.connect(bot).batchCallByBot([encodedGrantRole])).to.revertedWithCustomError(
        stateRelayerProxy,
        'ALREADY_IN_BATCH_CALL_BY_BOT',
      );
    });
  });
});
