import { BigNumber as BigFloatingNumber } from 'bignumber.js';

import { StateRelayer__factory } from '../generated';
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

// to run this file, run npx hardhat clean && npm i && npx hardhat run scripts/gasEstimation3BatchCallByBot.ts
async function estimateGasCost() {
  const { bot, stateRelayerProxy } = await deployContract();
  const stateRelayerInterface = StateRelayer__factory.createInterface();
  const batchCallStats: bigint[] = [];
  // the size of calldata between these batch calls should be the same
  // (due to the same names of dex pools)
  let maxBatchCallCallDataCost: bigint = 0n;

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

    const dexUpdateCallData = stateRelayerInterface.encodeFunctionData('updateDEXInfo', [dexesNames, dexValues, 1, 1]);

    const masterDataUpdateCallData = stateRelayerInterface.encodeFunctionData('updateMasterNodeInformation', [
      {
        totalValueLockedInMasterNodes: i,
        zeroYearLockedNoDecimals: i,
        fiveYearLockedNoDecimals: i,
        tenYearLockedNoDecimals: i,
      },
    ]);

    const vaultDataUpdateCallData = stateRelayerInterface.encodeFunctionData('updateVaultGeneralInformation', [
      {
        noOfVaultsNoDecimals: i,
        totalLoanValue: i,
        totalCollateralValue: i,
        totalCollateralizationRatio: i,
        activeAuctionsNoDecimals: i,
      },
    ]);

    const batchCallTx = await stateRelayerProxy
      .connect(bot)
      .batchCallByBot([dexUpdateCallData, masterDataUpdateCallData, vaultDataUpdateCallData]);
    const batchCallTxReceipt = await batchCallTx.wait();

    console.log('Successfully update ', i);
    console.log('The gas used for the batch call is ', batchCallTxReceipt!.gasUsed);
    if (i === 1) {
      maxBatchCallCallDataCost = BigInt((batchCallTx.data.length - 2) / 2) * 16n;
    }

    batchCallStats.push(batchCallTxReceipt!.gasUsed);
  }

  // average estimation (136.5 DFI)
  console.log(
    'Average estimated cost in DFI ',
    // take the second element of the array
    new BigFloatingNumber(
      ((batchCallStats[1] + maxBatchCallCallDataCost) * BigInt('50000000000')) // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );

  // worst-case estimation (485 DFI)
  console.log(
    'Maximum cost in DFI',
    new BigFloatingNumber(
      ((batchCallStats[0] + maxBatchCallCallDataCost) * BigInt('50000000000')) // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );
}

estimateGasCost();
