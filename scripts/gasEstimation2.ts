import { BigNumber as BigFloatingNumber } from 'bignumber.js';
import { BigNumber } from 'ethers';

import { deployContract } from '../tests/utils/deployment';

// dex names crawled from the mainnet defichain
const dexesNames = [
  'dETH-DFI',
  'dBTC-DFI',
  'dUSDT-DFI',
  'dDOGE-DFI',
  'dLTC-DFI',
  'dBCH-DFI',
  'dUSDC-DFI',
  'DUSD-DFI',
  'dBABA-DUSD',
  'dPLTR-DUSD',
  'dAAPL-DUSD',
  'dSPY-DUSD',
  'dQQQ-DUSD',
  'dPDBC-DUSD',
  'dVNQ-DUSD',
  'dARKK-DUSD',
  'dGLD-DUSD',
  'dURTH-DUSD',
  'dTLT-DUSD',
  'dSLV-DUSD',
  'dEEM-DUSD',
  'dNVDA-DUSD',
  'dCOIN-DUSD',
  'dMSFT-DUSD',
  'dNFLX-DUSD',
  'dVOO-DUSD',
  'dFB-DUSD',
  'dDIS-DUSD',
  'dMCHI-DUSD',
  'dMSTR-DUSD',
  'dINTC-DUSD',
  'dPYPL-DUSD',
  'dBRK.B-DUSD',
  'dPG-DUSD',
  'dKO-DUSD',
  'dSAP-DUSD',
  'dGSG-DUSD',
  'dURA-DUSD',
  'dCS-DUSD',
  'dAMZN-DUSD',
  'dPPLT-DUSD',
  'dTAN-DUSD',
  'dXOM-DUSD',
  'dGOVT-DUSD',
  'dGOOGL-DUSD',
  'dUSDT-DUSD',
  'dUSDC-DUSD',
  'dGME-DUSD',
  'dDAX-DUSD',
  'dJNJ-DUSD',
  'dADDYY-DUSD',
  'dGS-DUSD',
  'dTSLA-DUSD',
  'dWMT-DUSD',
  'dUL-DUSD',
  'dUNG-DUSD',
  'dUSO-DUSD',
  'csETH-dETH',
  'dARKX-DUSD',
  'dXLRE-DUSD',
  'dVBK-DUSD',
  'dXLE-DUSD',
  'dNSRGY-DUSD',
  'dSHEL-DUSD',
  'dSH-DUSD',
  'dBITI-DUSD',
  'dEUROC-DFI',
  'dEUROC-DUSD',
  'dBURN2-DUSD',
];

// to run this file, run npx hardhat clean && npm i && npx hardhat run scripts/gasEstimation2.ts
async function estimateGasCost() {
  const dexesData: BigNumber[] = [];
  const masterData: BigNumber[] = [];
  const vaultData: BigNumber[] = [];
  const burnData: BigNumber[] = [];
  let maxDexesCallDataCost = BigNumber.from(0);
  let maxMasterCallDataCost = BigNumber.from(0);
  let maxVaultCallDataCost = BigNumber.from(0);
  let maxBurnCallDataCost = BigNumber.from(0);
  const { bot, stateRelayerProxy } = await deployContract();
  for (let i = 1; i < 5; i += 1) {
    const dexValues: any[] = [];
    for (let j = 0; j < 69; j += 1) {
      dexValues.push({
        primaryTokenPrice: i,
        volume24H: i,
        totalLiquidity: i,
        APR: i,
        firstTokenBalance: i,
        secondTokenBalance: i,
        rewards: i,
        commissions: i,
        decimals: i,
      });
    }
    const dexUpdate = await stateRelayerProxy.connect(bot).updateDEXInfo(dexesNames, dexValues, 1, 1);
    const dexUpdateReceipt = await dexUpdate.wait();

    const masterDataUpdate = await stateRelayerProxy.connect(bot).updateMasterNodeInformation({
      totalValueLockedInMasterNodes: i,
      zeroYearLocked: i,
      fiveYearLocked: i,
      tenYearLocked: i,
      decimals: i,
    });
    const masterDataTxReceipt = await masterDataUpdate.wait();

    const vaultDataUpdate = await stateRelayerProxy.connect(bot).updateBurnInfo({
      fee: i,
      auction: i,
      payback: i,
      emission: i,
      total: i,
      decimals: i,
    });
    const vaultTxReceipt = await vaultDataUpdate.wait();

    const burnDataUpdate = await stateRelayerProxy.connect(bot).updateVaultGeneralInformation({
      noOfVaults: i,
      totalLoanValue: i,
      totalCollateralValue: i,
      totalCollateralizationRatio: i,
      activeAuctions: i,
      decimals: i,
    });
    const burnTxReceipt = await burnDataUpdate.wait();

    dexesData.push(dexUpdateReceipt.gasUsed);
    masterData.push(masterDataTxReceipt.gasUsed);
    vaultData.push(vaultTxReceipt.gasUsed);
    burnData.push(burnTxReceipt.gasUsed);

    console.log('Successfully update ', i);
    console.log('Total gas used');
    console.log(
      dexUpdateReceipt.gasUsed.add(masterDataTxReceipt.gasUsed).add(vaultTxReceipt.gasUsed).add(burnTxReceipt.gasUsed),
    );
    if (i === 1) {
      maxDexesCallDataCost = BigNumber.from(((dexUpdate.data.length - 2) / 2) * 16);
      maxMasterCallDataCost = BigNumber.from(((masterDataUpdate.data.length - 2) / 2) * 16);
      maxVaultCallDataCost = BigNumber.from(((vaultDataUpdate.data.length - 2) / 2) * 16);
      maxBurnCallDataCost = BigNumber.from(((burnDataUpdate.data.length - 2) / 2) * 16);
    }
  }

  // as predicted, change from zero to non-zero incurs more cost compared to changing from non-zero to non-zero
  // besides, because the number 2, 3, 4 are represented as
  // 0x0000000000000000000000000000000000000000000000000000000000000002
  // 0x0000000000000000000000000000000000000000000000000000000000000003
  // 0x0000000000000000000000000000000000000000000000000000000000000004
  // their representation in input data comprise the same number of non-zero / zero bytes
  // --> updating cost between when i = 2, i = 3 and i = 4 are the same
  console.log('Update dex data costs in gas units');
  console.log(dexesData);
  console.log('Update Master data costs in gas units');
  console.log(masterData);
  console.log('Update Vault data costs in gas units');
  console.log(vaultData);
  console.log('Update burn data costs in gas units');
  console.log(burnData);

  // average estimation
  console.log(
    'Average estimated cost in DFI ',
    // take the second element of the array
    new BigFloatingNumber(
      dexesData[1]
        .add(maxDexesCallDataCost)
        .add(masterData[1])
        .add(maxMasterCallDataCost)
        .add(vaultData[1])
        .add(maxVaultCallDataCost)
        .add(burnData[1])
        .add(maxBurnCallDataCost)
        .mul('50000000000') // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );

  // worst-case estimation
  console.log(
    'Maximum cost in DFI',
    new BigFloatingNumber(
      dexesData[0]
        .add(maxDexesCallDataCost)
        .add(masterData[0])
        .add(maxMasterCallDataCost)
        .add(vaultData[0])
        .add(maxVaultCallDataCost)
        .add(burnData[0])
        .add(maxBurnCallDataCost)
        .mul('50000000000') // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );
}

estimateGasCost();
