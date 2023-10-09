import { BigNumber as BigFloatingNumber } from 'bignumber.js';

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
  const dexesGasData: bigint[] = [];
  const masterGasData: bigint[] = [];
  const vaultGasData: bigint[] = [];
  let maxDexesCallDataCost = 0n;
  let maxMasterCallDataCost = 0n;
  let maxVaultCallDataCost = 0n;
  const { bot, stateRelayerProxy } = await deployContract();
  for (let i = 1; i < 5; i += 1) {
    const dexValues = new Array(dexesNames.length).fill({
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

    const dexUpdate = await stateRelayerProxy.connect(bot).updateDEXInfo(dexesNames, dexValues, 1, 1);
    const dexUpdateReceipt = await dexUpdate.wait();

    const masterDataUpdate = await stateRelayerProxy.connect(bot).updateMasterNodeInformation({
      totalValueLockedInMasterNodes: i,
      zeroYearLockedNoDecimals: i,
      fiveYearLockedNoDecimals: i,
      tenYearLockedNoDecimals: i,
    });
    const masterDataTxReceipt = await masterDataUpdate.wait();

    const vaultDataUpdate = await stateRelayerProxy.connect(bot).updateVaultGeneralInformation({
      noOfVaultsNoDecimals: i,
      totalLoanValue: i,
      totalCollateralValue: i,
      totalCollateralizationRatio: i,
      activeAuctionsNoDecimals: i,
    });
    const vaultTxReceipt = await vaultDataUpdate.wait();

    dexesGasData.push(dexUpdateReceipt!.gasUsed);
    masterGasData.push(masterDataTxReceipt!.gasUsed);
    vaultGasData.push(vaultTxReceipt!.gasUsed);

    console.log('Successfully update ', i);
    console.log('Total gas used');
    console.log(dexUpdateReceipt!.gasUsed + masterDataTxReceipt!.gasUsed + vaultTxReceipt!.gasUsed);
    if (i === 1) {
      maxDexesCallDataCost = BigInt((dexUpdate.data.length - 2) / 2) * 16n;
      maxMasterCallDataCost = BigInt((masterDataUpdate.data.length - 2) / 2) * 16n;
      maxVaultCallDataCost = BigInt((vaultDataUpdate.data.length - 2) / 2) * 16n;
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
  console.log(dexesGasData);
  console.log('Update Master data costs in gas units');
  console.log(masterGasData);
  console.log('Update Vault data costs in gas units');
  console.log(vaultGasData);

  // average estimation (137.5 DFI)
  console.log(
    'Average estimated cost in DFI ',
    // take the second element of the array
    new BigFloatingNumber(
      (
        (dexesGasData[1] +
          maxDexesCallDataCost +
          masterGasData[1] +
          maxMasterCallDataCost +
          vaultGasData[1] +
          maxVaultCallDataCost) *
        BigInt('50000000000')
      ) // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );

  // worst-case estimation (486 DFI)
  console.log(
    'Maximum cost in DFI',
    new BigFloatingNumber(
      (
        (dexesGasData[0] +
          maxDexesCallDataCost +
          masterGasData[0] +
          maxMasterCallDataCost +
          vaultGasData[0] +
          maxVaultCallDataCost) *
        BigInt('50000000000')
      ) // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );
}

estimateGasCost();
