import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

import { StateRelayer } from '../generated';
import { deployContract } from './utils/deployment';

describe('data tests', () => {
  let stateRelayerProxy: StateRelayer;
  let bot: SignerWithAddress;

  it('Should successfully set master node data', async () => {
    ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
    const masterNodeData: MasterNode = {
      tvl: 108,
      zeroYearTVL: 101,
      fiveYearTVL: 102,
      tenYearTVL: 103,
      lastUpdated: 101010,
    };
    await stateRelayerProxy.connect(bot).updateMasternodeInformation(masterNodeData);
    const receivedMasterNodeData = await stateRelayerProxy.masterNodeInformation();
    expect(receivedMasterNodeData.tvl).to.equal(masterNodeData.tvl);
    expect(receivedMasterNodeData.zeroYearTVL).to.equal(masterNodeData.zeroYearTVL);
    expect(receivedMasterNodeData.fiveYearTVL).to.equal(masterNodeData.fiveYearTVL);
    expect(receivedMasterNodeData.tenYearTVL).to.equal(masterNodeData.tenYearTVL);
    expect(receivedMasterNodeData.lastUpdated).to.equal(masterNodeData.lastUpdated);
  });

  it('Should successfully set vault node data', async () => {
    ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
    const vaultInformationData: VaultGeneralInformation = {
      noOfVaults: 2,
      totalLoanValue: 1000,
      totalCollateralValue: 23432,
      totalCollateralizationRation: 234,
      activeAuctions: 23,
      lastUpdated: 34244,
    };
    await stateRelayerProxy.connect(bot).updateVaultGeneralInformation(vaultInformationData);
    const receivedMasterNodeData = await stateRelayerProxy.vaultInfo();
    expect(receivedMasterNodeData.noOfVaults).to.equal(vaultInformationData.noOfVaults);
    expect(receivedMasterNodeData.totalLoanValue).to.equal(vaultInformationData.totalLoanValue);
    expect(receivedMasterNodeData.totalCollateralValue).to.equal(
      vaultInformationData.totalCollateralValue
    );
    expect(receivedMasterNodeData.totalCollateralizationRation).to.equal(
      vaultInformationData.totalCollateralizationRation
    );
    expect(receivedMasterNodeData.activeAuctions).to.equal(vaultInformationData.activeAuctions);
    expect(receivedMasterNodeData.lastUpdated).to.equal(vaultInformationData.lastUpdated);
  });

  it('Should successfully set dexs data', async () => {
    ({ stateRelayerProxy, bot } = await loadFixture(deployContract));

    const dexDataEth: DexInfo = {
      primaryTokenPrice: 113,
      volume: 102021,
      totalLiquidity: 2164,
      APR: 14,
      firstTokenBalance: 31269,
      secondTokenBalance: 2314,
      rewards: 124,
      commissions: 3,
      lastUpdated: 1231,
      decimals: 18,
    };
    const dexDataBtc: DexInfo = {
      primaryTokenPrice: 112,
      volume: 102020,
      totalLiquidity: 2163,
      APR: 12,
      firstTokenBalance: 31265,
      secondTokenBalance: 2312,
      rewards: 123,
      commissions: 2,
      lastUpdated: 1233,
      decimals: 18,
    };
    const dexsData: DexInfo[] = [dexDataEth, dexDataBtc];
    const symbols: string[] = ['eth', 'btc'];
    await stateRelayerProxy.connect(bot).updateDEXInfo(symbols, dexsData);
    // Getting ETH dex Data
    const receivedEThDexData = await stateRelayerProxy.DEXInfoMapping(symbols[0]);
    // Testing that the received is as expected as dexDataEth
    expect(receivedEThDexData.primaryTokenPrice).to.equal(dexDataEth.primaryTokenPrice);
    expect(receivedEThDexData.volume).to.equal(dexDataEth.volume);
    expect(receivedEThDexData.totalLiquidity).to.equal(dexDataEth.totalLiquidity);
    expect(receivedEThDexData.APR).to.equal(dexDataEth.APR);
    expect(receivedEThDexData.firstTokenBalance).to.equal(dexDataEth.firstTokenBalance);
    expect(receivedEThDexData.secondTokenBalance).to.equal(dexDataEth.secondTokenBalance);
    expect(receivedEThDexData.rewards).to.equal(dexDataEth.rewards);
    expect(receivedEThDexData.commissions).to.equal(dexDataEth.commissions);
    expect(receivedEThDexData.decimals).to.equal(dexDataEth.decimals);

    // Getting BTC dex Data
    const receivedBtcDexData = await stateRelayerProxy.DEXInfoMapping(symbols[1]);
    // Testing that the received is as expected as dexDataBtc
    expect(receivedBtcDexData.primaryTokenPrice).to.equal(dexDataBtc.primaryTokenPrice);
    expect(receivedBtcDexData.volume).to.equal(dexDataBtc.volume);
    expect(receivedBtcDexData.totalLiquidity).to.equal(dexDataBtc.totalLiquidity);
    expect(receivedBtcDexData.APR).to.equal(dexDataBtc.APR);
    expect(receivedBtcDexData.firstTokenBalance).to.equal(dexDataBtc.firstTokenBalance);
    expect(receivedBtcDexData.secondTokenBalance).to.equal(dexDataBtc.secondTokenBalance);
    expect(receivedBtcDexData.rewards).to.equal(dexDataBtc.rewards);
    expect(receivedBtcDexData.commissions).to.equal(dexDataBtc.commissions);
    expect(receivedBtcDexData.decimals).to.equal(dexDataBtc.decimals);
  });
});

interface MasterNode {
  tvl: number;
  zeroYearTVL: number;
  fiveYearTVL: number;
  tenYearTVL: number;
  lastUpdated: number;
}

interface VaultGeneralInformation {
  noOfVaults: number;
  totalLoanValue: number;
  totalCollateralValue: number;
  totalCollateralizationRation: number;
  activeAuctions: number;
  lastUpdated: number;
}

interface DexInfo {
  primaryTokenPrice: number;
  volume: number;
  totalLiquidity: number;
  APR: number;
  firstTokenBalance: number;
  secondTokenBalance: number;
  rewards: number;
  commissions: number;
  lastUpdated: number;
  decimals: number;
}
