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

    const burnDataUpdate = await stateRelayerProxy.connect(bot).updateBurnInfo({
      burnAddress: '8defichainBurnAddressXXXXXXXdRQkSm',
      amount: '1560417037859082200',
      tokens: [
        '7260.95539278@DFI',
        '17089.00000000@ETH',
        '5467.86380022@BTC',
        '38202000.00000000@USDT',
        '21120000.00000000@DOGE',
        '61506.00000000@LTC',
        '12305.00000000@BCH',
        '28750000.00000000@USDC',
        '6779.79729315@DUSD',
        '115.03602640@AMZN',
        '90.86452340@GOOGL',
        '1029.33274752@GME',
        '170.86966671@TSLA',
        '352.54572135@csETH',
        '3000000.00000000@SINGA#192',
        '1143000.00000000@EUROC',
      ],
      feeBurn: (336381500000000 + i).toString(),
      emissionBurn: (987835496621767300 + i).toString(),
      auctionBurn: (17843399029615200 + i).toString(),
      paybackBurn: (617050581749106000 + i).toString(),
      paybackBurnTokens: [
        '61705058.17491060@DFI',
        '679521.59492769@DUSD',
        '0.05978433@TSLA/v1',
        '0.28124897@BABA',
        '0.26923523@GME/v1',
        '1.52231437@PLTR',
        '0.23946592@AAPL',
        '0.00517549@GOOGL/v1',
        '0.38492809@ARKK',
        '0.40041497@SPY',
        '0.25738191@QQQ',
        '0.10706534@GLD',
        '0.53795061@SLV',
        '0.53106624@PDBC',
        '0.10541320@VNQ',
        '0.07249486@URTH',
        '0.18044948@TLT',
        '0.00697823@AMZN/v1',
        '0.35405397@COIN',
        '0.40299727@EEM',
        '0.22641911@NVDA',
        '0.11475324@MSFT',
        '0.04117078@VOO',
        '0.16749287@FB',
        '0.08232126@NFLX',
        '0.16283608@DIS',
        '0.16390783@MSTR',
        '0.22887142@MCHI',
        '0.51173514@INTC',
        '0.26930992@PYPL',
        '0.06742901@KO',
        '0.01968046@BRK.B',
        '0.03849486@PG',
        '0.04091963@SAP',
        '3.07886179@CS',
        '0.09373318@GSG',
        '0.21653671@URA',
        '0.05558515@AMZN',
        '0.06122774@PPLT',
        '0.14039830@GOVT',
        '0.07389235@XOM',
        '0.05397413@TAN',
        '0.02380768@GOOGL',
        '0.21206979@GME',
        '0.02516174@JNJ',
        '0.34991120@DAX',
        '0.01912369@GS',
        '0.09847354@ADDYY',
        '0.03332166@TSLA',
        '0.05782171@UL',
        '0.83115724@UNG',
        '0.09175711@USO',
        '0.02805576@WMT',
        '0.12910091@ARKX',
        '0.03333218@XLE',
        '0.00608251@VBK',
        '0.11771750@XLRE',
      ],
      dexFeeTokens: [
        '130.17947440@BTC',
        '44026365.16395163@DUSD',
        '56.74981351@TSLA/v1',
        '263.14833846@BABA',
        '255.29223156@GME/v1',
        '2405.88047515@PLTR',
        '161.85169240@AAPL',
        '4.52908964@GOOGL/v1',
        '349.20982560@ARKK',
        '143.79416831@SPY',
        '90.82191816@QQQ',
        '140.51012596@GLD',
        '784.95608394@SLV',
        '504.38719380@PDBC',
        '48.96421401@VNQ',
        '94.16052097@URTH',
        '372.44956024@TLT',
        '5.72644232@AMZN/v1',
        '1131.99647628@COIN',
        '229.68812081@EEM',
        '191.21713640@NVDA',
        '68.77285636@MSFT',
        '18.68433473@VOO',
        '219.71584352@FB',
        '141.60429680@NFLX',
        '53.95016624@DIS',
        '640.23754821@MSTR',
        '167.11343822@MCHI',
        '160.66915189@INTC',
        '121.31322937@PYPL',
        '117.68424728@KO',
        '35.29740229@BRK.B',
        '38.71896623@PG',
        '21.09438997@SAP',
        '1232.19070353@CS',
        '110.30563720@GSG',
        '167.29251316@URA',
        '109.27712128@AMZN',
        '28.19743974@PPLT',
        '247.26477877@GOVT',
        '53.73707190@XOM',
        '23.78908680@TAN',
        '36.85986683@GOOGL',
        '358.99148065@GME',
        '11.46536015@JNJ',
        '188.16141374@DAX',
        '6.30991148@GS',
        '55.30629104@ADDYY',
        '118.83347494@TSLA',
        '9.16978780@UL',
        '307.24436723@UNG',
        '15.85028470@USO',
        '3.80298809@WMT',
        '38.39167585@ARKX',
        '6.87136867@XLE',
        '0.71162875@VBK',
        '4.73959178@XLRE',
      ],
      dfiPaybackFee: (6112251916719500 + i).toString(),
      dfiPaybackTokens: ['223563786.46853752@DUSD'],
      paybackFees: [],
      paybackTokens: [],
      dfiP2203: [
        '95826877.42238083@DUSD',
        '5717.96146342@BABA',
        '94445.98902866@PLTR',
        '7145.94390638@AAPL',
        '10150.55744984@ARKK',
        '815.53307257@SPY',
        '2330.08364343@QQQ',
        '614.34777807@GLD',
        '18557.38586184@SLV',
        '11449.23294944@PDBC',
        '1384.19326976@VNQ',
        '1480.79613922@URTH',
        '2275.07126117@TLT',
        '25593.20606983@COIN',
        '1007.51290636@EEM',
        '5843.11309658@NVDA',
        '2246.05824448@MSFT',
        '492.59991478@VOO',
        '12884.36958277@FB',
        '4250.76771011@NFLX',
        '1041.86399835@DIS',
        '23603.01035381@MSTR',
        '2597.06005243@MCHI',
        '3608.79325694@INTC',
        '102.14428526@PYPL',
        '3489.23010521@KO',
        '686.16098091@BRK.B',
        '1290.99428796@PG',
        '1182.18720888@SAP',
        '5746.10415746@CS',
        '1771.75045516@GSG',
        '368.61084117@URA',
        '10795.99210501@AMZN',
        '385.13132782@PPLT',
        '134.36061045@GOVT',
        '814.08410872@XOM',
        '865.38391231@TAN',
        '4919.04183571@GOOGL',
        '21204.42694198@GME',
        '292.20829788@JNJ',
        '5112.11655058@DAX',
        '197.13624167@GS',
        '882.72222383@ADDYY',
        '9224.80722847@TSLA',
        '266.19760881@UL',
        '3293.60688419@UNG',
        '70.54212784@USO',
        '5.38754350@WMT',
        '1974.09133946@ARKX',
        '68.61962332@XLE',
        '0.00000160@VBK',
        '218.34648049@XLRE',
        '7356.22519535@BITI',
        '24.96788285@SHEL',
      ],
      dfiP2206F: [],
      decimals: 10,
    });
    const burnTxReceipt = await burnDataUpdate.wait();

    const vaultDataUpdate = await stateRelayerProxy.connect(bot).updateVaultGeneralInformation({
      noOfVaults: i,
      totalLoanValue: i,
      totalCollateralValue: i,
      totalCollateralizationRatio: i,
      activeAuctions: i,
      decimals: i,
    });
    const vaultTxReceipt = await vaultDataUpdate.wait();

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

  // average estimation (173 DFI)
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

  // worst-case estimation (570 DFI)
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
