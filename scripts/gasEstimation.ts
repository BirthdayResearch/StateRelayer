import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import axios from 'axios';
import { BigNumber as BigFloatingNumber } from 'bignumber.js';
import { BigNumber } from 'ethers';

import { handler } from '../bot/StateRelayerBot';
import { deployContract } from '../tests/utils/deployment';

// to run this file, run npx hardhat run scripts/gasEstimation
async function feedData() {
  const dexesData: BigNumber[] = [];
  const masterData: BigNumber[] = [];
  const vaultData: BigNumber[] = [];
  const burnData: BigNumber[] = [];
  const { bot, stateRelayerProxy } = await deployContract();
  for (let i = 0; i < 10; i += 1) {
    const { dexInfoTxReceipt, masterDataTxReceipt, vaultTxReceipt, burnTxReceipt } = await handler({
      testGasCost: true,
      urlNetwork: 'https://ocean.defichain.com/',
      envNetwork: EnvironmentNetwork.MainNet,
      contractAddress: stateRelayerProxy.address, // Proxy contract address
      signer: bot,
    });
    dexesData.push(dexInfoTxReceipt.gasUsed);
    masterData.push(masterDataTxReceipt.gasUsed);
    vaultData.push(vaultTxReceipt.gasUsed);
    burnData.push(burnTxReceipt.gasUsed);
    console.log('Successfully update ', i);
    await new Promise((r) => setTimeout(r, 10 * 1000));
  }
  console.log('Update DEXes');
  await displayCost(dexesData);
  console.log('Update Masterdata');
  await displayCost(masterData);
  console.log('Update Vault data');
  await displayCost(vaultData);
  console.log('Update burn data');
  await displayCost(burnData);
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

async function displayCost(arr: BigNumber[]) {
  // assume 1 gas = 30 gWei
  const initialCostUpdateInGas = new BigFloatingNumber(arr[0].mul(30).mul(BigNumber.from(10).pow(9)).toString()).div(
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
}

feedData();
