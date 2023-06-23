import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { StateRelayer } from '../generated';
import { deployContract } from './utils/deployment';

type BigNumber = ethers.bigNumber

describe('State relayer contract data tests', () => {
  let stateRelayerProxy: StateRelayer;
  let bot: SignerWithAddress;
  let user: SignerWithAddress;
  describe('Successful', () => {
    it('Should successfully set master node data', async () => {
      ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
      const masterNodeData: MasterNode = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLocked: 101,
        fiveYearLocked: 102,
        tenYearLocked: 103,
        decimals: 10,
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
        noOfVaults: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctions: 23,
        decimals: 10,
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
        decimals: 18,
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
        decimals: 18,
      };
      const dexsData: DexInfo[] = [dexDataEth, dexDataBtc];
      const symbols: string[] = ['eth', 'btc'];
      await expect(stateRelayerProxy.connect(bot).updateDEXInfo(symbols, dexsData,totalValueLockInPoolPair, total24HVolume)).to.emit(
        stateRelayerProxy,
        'UpdateDEXInfo',
      );
      // Getting ETH dex Data
      const receivedEThDexData = await stateRelayerProxy.getDexPairInfo(symbols[0]);
      // Testing that the received is as expected as dexDataEth
      expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
      // Getting BTC dex Data
      const receivedBtcDexData = await stateRelayerProxy.getDexPairInfo(symbols[1]);
      // Testing that the received is as expected as dexDataBtc
      expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());
    });
  });

  describe('UnSuccessful', () => {
    // These tests should fail as the signer does not have the `BOT_ROLE` assigned.
    // Only addresses with role assigned as `BOT_ROLE` can perform the updates.

    it('`updateMasterNodeInformation` - Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const masterNodeData: MasterNode = {
        totalValueLockedInMasterNodes: 108,
        zeroYearLocked: 101,
        fiveYearLocked: 102,
        tenYearLocked: 103,
        decimals: 10,
      };
      await expect(stateRelayerProxy.connect(user).updateMasterNodeInformation(masterNodeData)).to.be.reverted;
    });

    it('`updateVaultGeneralInformation` - Should successfully revert if the signer is not `bot`', async () => {
      ({ stateRelayerProxy, user } = await loadFixture(deployContract));
      const vaultInformationData: VaultGeneralInformation = {
        noOfVaults: 2,
        totalLoanValue: 1000,
        totalCollateralValue: 23432,
        totalCollateralizationRatio: 234,
        activeAuctions: 23,
        decimals: 10,
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
        decimals: 18,
      };
      await expect(stateRelayerProxy.connect(user).updateDEXInfo(['eth'], [dexDataEth], 1, 2)).to.be.reverted;
    });
  });
});

interface MasterNode {
  totalValueLockedInMasterNodes: BigNumber;
  zeroYearLocked: BigNumber;
  fiveYearLocked: BigNumber;
  tenYearLocked: BigNumber;
  decimals: BigNumber;
}

interface VaultGeneralInformation {
  noOfVaults: BigNumber;
  totalLoanValue: BigNumber;
  totalCollateralValue: BigNumber;
  totalCollateralizationRatio: BigNumber;
  activeAuctions: BigNumber;
  decimals: BigNumber;
}

interface DexInfo {
  primaryTokenPrice: BigNumber;
  volume24H: BigNumber;
  totalLiquidity: BigNumber;
  APR: BigNumber;
  firstTokenBalance: BigNumber;
  secondTokenBalance: BigNumber;
  rewards: BigNumber;
  commissions: BigNumber;
  decimals: BigNumber;
}
