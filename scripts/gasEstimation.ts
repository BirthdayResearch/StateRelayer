import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import axios from 'axios';
import { BigNumber as BigFloatingNumber } from 'bignumber.js';
import { BigNumber } from 'ethers';

import { handler } from '../bot/StateRelayerBot';
import { deployContract } from '../tests/utils/deployment';

// to run this file, run npx hardhat clean && npm i && npx hardhat run scripts/gasEstimation.ts
// some old estimation: at 0.34 USD, estimation is 35 USD per month
async function estimateGasCost() {
  const dexesData: BigNumber[] = [];
  const masterData: BigNumber[] = [];
  const vaultData: BigNumber[] = [];
  const burnData: BigNumber[] = [];
  const { bot, stateRelayerProxy } = await deployContract();
  for (let i = 0; i < 10; i += 1) {
    const data = await handler({
      testGasCost: true,
      urlNetwork: 'https://ocean.defichain.com/',
      envNetwork: EnvironmentNetwork.MainNet,
      contractAddress: stateRelayerProxy.address, // Proxy contract address
      signer: bot,
    });
    if (data === undefined) break;
    const { dexInfoTxReceipt, masterDataTxReceipt, vaultTxReceipt, burnTxReceipt } = data;
    dexesData.push(dexInfoTxReceipt!.gasUsed);
    masterData.push(masterDataTxReceipt!.gasUsed);
    vaultData.push(vaultTxReceipt!.gasUsed);
    burnData.push(burnTxReceipt!.gasUsed);
    console.log('Successfully update ', i);
    await new Promise((r) => setTimeout(r, 10 * 1000));
  }
  console.log('Update DEXes');
  const averageCostUpdateDEX = await calculateAverageCost(dexesData);
  console.log('Update Masterdata');
  const averageCostUpdateMasterData = await calculateAverageCost(masterData);
  console.log('Update Vault data');
  const averageCostUpdateVaultData = await calculateAverageCost(vaultData);
  console.log('Update burn data');
  const averageCostBurnData = await calculateAverageCost(burnData);
  console.log(
    'Average cost of updating all data in USD at one time is ',
    averageCostUpdateDEX
      .plus(averageCostUpdateMasterData)
      .plus(averageCostUpdateVaultData)
      .plus(averageCostBurnData)
      .toString(),
  );
}

async function getPrice(): Promise<BigFloatingNumber> {
  // id of DFI is 5804
  const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=5804', {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.COIN_MARKET_CAP_API,
    },
  });
  return new BigFloatingNumber(response.data.data['5804'].quote.USD.price);
}

async function calculateAverageCost(arr: BigNumber[]): Promise<BigFloatingNumber> {
  // assume 1 gas = 50 gWei
  const initialCostUpdateInGas = new BigFloatingNumber(arr[0].mul(50).mul(BigNumber.from(10).pow(9)).toString()).div(
    new BigFloatingNumber(10).pow(18),
  );

  const initialCostUpdateInUSD = (await getPrice()).multipliedBy(initialCostUpdateInGas);
  const laterAverageCostUpdateInGas = new BigFloatingNumber(
    arr
      .slice(1)
      .reduce((accu, ele) => accu.add(ele), BigNumber.from(0))
      .toString(),
  )
    .div(arr.length - 1)
    .multipliedBy(30)
    .multipliedBy(new BigFloatingNumber(10).pow(9))
    .div(new BigFloatingNumber(10).pow(18));
  const laterAverageCostUpdateInUSD = (await getPrice()).multipliedBy(laterAverageCostUpdateInGas);
  // we split the estimation into two because generally,
  // the cost of switching zero to non-zero in storage results in higher gas cost than normal
  // Reference:
  // - https://ethereum.stackexchange.com/questions/99136/why-does-zero-to-non-zero-in-storage-take-higher-gas
  // - https://hackmd.io/@fvictorio/gas-costs-after-berlin
  console.log('Initial cost in USD is');
  console.log(initialCostUpdateInUSD.toString());
  console.log('Later average cost in USD is');
  console.log(laterAverageCostUpdateInUSD.toString());
  return laterAverageCostUpdateInUSD;
}

estimateGasCost();
