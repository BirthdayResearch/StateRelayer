import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { IStateRelayer, StateRelayer, StateRelayerV2__factory } from "../generated";
import { deployContract, DeployedContractAndSigner } from "./utils/deployment";

type MasterNodeInformationStruct = IStateRelayer.MasterNodeInformationStruct;
type VaultGeneralInformation = IStateRelayer.VaultGeneralInformationStruct;
type DexInfo = IStateRelayer.DEXInfoStruct;

describe("Proxy behavior", () => {
  let stateRelayerProxy: StateRelayer;
  let stateRelayer: StateRelayer;
  let admin: SignerWithAddress;
  let bot: SignerWithAddress;
  const masterNodeData: MasterNodeInformationStruct = {
    totalValueLockedInMasterNodes: 108,
    zeroYearLockedNoDecimals: 101,
    fiveYearLockedNoDecimals: 102,
    tenYearLockedNoDecimals: 103,
  };

  const vaultInformationData: VaultGeneralInformation = {
    noOfVaultsNoDecimals: 2,
    totalLoanValue: 1000,
    totalCollateralValue: 23432,
    totalCollateralizationRatio: 234,
    activeAuctionsNoDecimals: 23,
  };

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

  before(async () => {
    const fixture: DeployedContractAndSigner = await loadFixture(deployContract);
    bot = fixture.bot;
    admin = fixture.admin;
    stateRelayerProxy = fixture.stateRelayerProxy;
    stateRelayer = fixture.stateRelayer;
  });

  async function setData () {
    // set MN's data
    await expect(stateRelayerProxy.connect(bot).updateMasterNodeInformation(masterNodeData)).to.emit(
      stateRelayerProxy,
      'UpdateMasterNodeInformation',
    );
    const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());

    // set vault data
    await expect(stateRelayerProxy.connect(bot).updateVaultGeneralInformation(vaultInformationData)).to.emit(
      stateRelayerProxy,
      'UpdateVaultGeneralInformation',
    );
    const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
    expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());

    // set Dex data
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
  }

  async function checkPrevData () {
    // check MN's data
    const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(masterNodeData).toString());

    // check vault data
    const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
    expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(vaultInformationData).toString());

    // check Dex data
    // Getting ETH dex Data
    const receivedEThDexData = await stateRelayerProxy.getDexPairInfo(symbols[0]);
    // Testing that the received is as expected as dexDataEth
    expect(receivedEThDexData[1].toString()).to.equal(Object.values(dexDataEth).toString());
    // Getting BTC dex Data
    const receivedBtcDexData = await stateRelayerProxy.getDexPairInfo(symbols[1]);
    // Testing that the received is as expected as dexDataBtc
    expect(receivedBtcDexData[1].toString()).to.equal(Object.values(dexDataBtc).toString());

    const dexInfo = await stateRelayerProxy.getDexInfo()
    expect(total24HVolume).to.equal(dexInfo[1]);
    expect(totalValueLockInPoolPair).to.equal(dexInfo[2]);
  }

  it("Should not upgrade contract from non admin address", async () => {
    // Encoded MarbleLsdV2 data
    const StateRelayerV2Upgradeable =
      await ethers.getContractFactory("StateRelayerV2");
    const stateRelayerV2Upgradeable = await StateRelayerV2Upgradeable.deploy();
    await stateRelayerV2Upgradeable.waitForDeployment();
    const encodedData = StateRelayerV2__factory.createInterface().encodeFunctionData("initialize", [
      // Contract version
      2,
    ]);
   

    // Upgrading the Proxy contract
    const stateRelayerV2Address = await stateRelayerV2Upgradeable.getAddress();
    const adminRoleHash = await stateRelayerProxy.DEFAULT_ADMIN_ROLE();

    await expect(
      stateRelayerProxy
        .connect(bot)
        .upgradeToAndCall(stateRelayerV2Address, encodedData),
    ).to.be.revertedWith(
      `AccessControl: account ${bot.address.toLowerCase()} is missing role ${adminRoleHash}`,
    );
  });

  it("Should upgrade and test contract's functionality and storage slots", async () => {
    await setData();
    const StateRelayerV2Upgradeable =
    await ethers.getContractFactory("StateRelayerV2");
    const stateRelayerV2Upgradeable = await StateRelayerV2Upgradeable.deploy();
    await stateRelayerV2Upgradeable.waitForDeployment();
    const initialImplementationAddress = await upgrades.erc1967.getImplementationAddress(await stateRelayerProxy.getAddress())
    expect(await stateRelayer.getAddress()).to.equal(initialImplementationAddress);

    const encodedData = StateRelayerV2__factory.createInterface().encodeFunctionData("initialize", [
      // Contract version
      2,
    ]);

    // Upgrading the Proxy contract
    const stateRelayerV2Address = await stateRelayerV2Upgradeable.getAddress();
    await stateRelayerProxy
      .connect(admin)
      .upgradeToAndCall(stateRelayerV2Address, encodedData)

    const updatedImplementationAddress = await upgrades.erc1967.getImplementationAddress(await stateRelayerProxy.getAddress())
    expect(stateRelayerV2Address).to.equal(updatedImplementationAddress);
    await checkPrevData()


    const updatedMasterNodeData: MasterNodeInformationStruct = {
      totalValueLockedInMasterNodes: 1,
      zeroYearLockedNoDecimals: 2,
      fiveYearLockedNoDecimals: 3,
      tenYearLockedNoDecimals: 4,
    };
    await expect(stateRelayerProxy.connect(bot).updateMasterNodeInformation(updatedMasterNodeData)).to.emit(
      stateRelayerProxy,
      'UpdateMasterNodeInformation',
    );
    const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(updatedMasterNodeData).toString());
  });

  it('Should successfully set master node data on updated contract', async () => {
    const updatedMasterNodeData: MasterNodeInformationStruct = {
      totalValueLockedInMasterNodes: 1,
      zeroYearLockedNoDecimals: 2,
      fiveYearLockedNoDecimals: 3,
      tenYearLockedNoDecimals: 4,
    };
    await expect(stateRelayerProxy.connect(bot).updateMasterNodeInformation(updatedMasterNodeData)).to.emit(
      stateRelayerProxy,
      'UpdateMasterNodeInformation',
    );
    const receivedMasterNodeData = await stateRelayerProxy.getMasterNodeInfo();
    expect(receivedMasterNodeData[1].toString()).to.equal(Object.values(updatedMasterNodeData).toString());
  });

  it('Should successfully set vault node data on updated contract', async () => {
    ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
    const updatedVaultInformationData: VaultGeneralInformation = {
      noOfVaultsNoDecimals: 10,
      totalLoanValue: 12,
      totalCollateralValue: 12,
      totalCollateralizationRatio: 13,
      activeAuctionsNoDecimals: 14,
    };
    await expect(stateRelayerProxy.connect(bot).updateVaultGeneralInformation(updatedVaultInformationData)).to.emit(
      stateRelayerProxy,
      'UpdateVaultGeneralInformation',
    );
    const receivedVaultInformationData = await stateRelayerProxy.getVaultInfo();
    expect(receivedVaultInformationData[1].toString()).to.equal(Object.values(updatedVaultInformationData).toString());
  });

  it('Should successfully set dexs data on updated contract', async () => {
    ({ stateRelayerProxy, bot } = await loadFixture(deployContract));
    const updatedTotalValueLockInPoolPair = 53426435624;
    const updatedTotal24HVolume = 12312312313;
    const dexDataApple: DexInfo = {
      primaryTokenPrice: 100,
      volume24H: 1124,
      totalLiquidity: 421,
      APR: 50,
      firstTokenBalance: 1111,
      secondTokenBalance: 2211,
      rewards: 121,
      commissions: 5,
    };
    const dexDataNetflix: DexInfo = {
      primaryTokenPrice: 500,
      volume24H: 44343,
      totalLiquidity: 3234,
      APR: 222,
      firstTokenBalance: 21212,
      secondTokenBalance: 3243,
      rewards: 2323,
      commissions: 9,
    };
    const updatedDexsData: DexInfo[] = [dexDataApple, dexDataNetflix];
    const updatedSymbols: string[] = ['apple', 'netflix'];
    await expect(
      stateRelayerProxy.connect(bot).updateDEXInfo(updatedSymbols, updatedDexsData, updatedTotalValueLockInPoolPair, updatedTotal24HVolume),
    ).to.emit(stateRelayerProxy, 'UpdateDEXInfo');
    // Getting ETH dex Data
    const receivedAppleDexData = await stateRelayerProxy.getDexPairInfo(updatedSymbols[0]);
    // Testing that the received is as expected as dexDataEth
    expect(receivedAppleDexData[1].toString()).to.equal(Object.values(dexDataApple).toString());
    // Getting BTC dex Data
    const receivedNetflixDexData = await stateRelayerProxy.getDexPairInfo(updatedSymbols[1]);
    // Testing that the received is as expected as dexDataBtc
    expect(receivedNetflixDexData[1].toString()).to.equal(Object.values(dexDataNetflix).toString());
    const dexInfo = await stateRelayerProxy.getDexInfo()
    expect(updatedTotal24HVolume).to.equal(dexInfo[1]);
    expect(updatedTotalValueLockInPoolPair).to.equal(dexInfo[2]);
  });
});
