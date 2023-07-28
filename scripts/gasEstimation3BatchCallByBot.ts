import { BigNumber as BigFloatingNumber } from 'bignumber.js';
import { BigNumber } from 'ethers';

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
  const batchCallStats: BigNumber[] = [];
  // the size of calldata between these batch calls should be the same
  // (due to the same names of dex pools)
  let maxBatchCallCallDataCost = BigNumber.from(0);

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

    const dexUpdateCallData = stateRelayerInterface.encodeFunctionData('updateDEXInfo', [dexesNames, dexValues, 1, 1]);

    const masterDataUpdateCallData = stateRelayerInterface.encodeFunctionData('updateMasterNodeInformation', [
      {
        totalValueLockedInMasterNodes: i,
        zeroYearLocked: i,
        fiveYearLocked: i,
        tenYearLocked: i,
        decimals: i,
      },
    ]);

    const vaultDataUpdateCallData = stateRelayerInterface.encodeFunctionData('updateBurnInfo', [
      {
        fee: i,
        auction: i,
        payback: i,
        emission: i,
        total: i,
        decimals: i,
      },
    ]);

    const burnUpdateCallData = stateRelayerInterface.encodeFunctionData('updateVaultGeneralInformation', [
      {
        noOfVaults: i,
        totalLoanValue: i,
        totalCollateralValue: i,
        totalCollateralizationRatio: i,
        activeAuctions: i,
        decimals: i,
      },
    ]);

    const batchCallTx = await stateRelayerProxy
      .connect(bot)
      .batchCallByBot([dexUpdateCallData, masterDataUpdateCallData, vaultDataUpdateCallData, burnUpdateCallData]);
    const batchCallTxReceipt = await batchCallTx.wait();

    console.log('Successfully update ', i);
    console.log('The gas used for the batch call is ', batchCallTxReceipt.gasUsed);
    if (i === 1) {
      maxBatchCallCallDataCost = BigNumber.from(((batchCallTx.data.length - 2) / 2) * 16);
    }

    batchCallStats.push(batchCallTxReceipt.gasUsed);
  }

  // average estimation (171 DFI)
  console.log(
    'Average estimated cost in DFI ',
    // take the second element of the array
    new BigFloatingNumber(
      batchCallStats[1]
        .add(maxBatchCallCallDataCost)
        .mul('50000000000') // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );

  // worst-case estimation (568 DFI)
  console.log(
    'Maximum cost in DFI',
    new BigFloatingNumber(
      batchCallStats[0]
        .add(maxBatchCallCallDataCost)
        .mul('50000000000') // multiply the gas units with the estimated effectiveGasPrice -- 50 gWei
        .toString(),
    )
      .div(new BigFloatingNumber(10).pow(18)) // decimals of native DFI on DMC = 18
      .multipliedBy(30 * 24) // multiply by 30 days per month, 24 hours per day.
      .toString(),
  );
}

estimateGasCost();
