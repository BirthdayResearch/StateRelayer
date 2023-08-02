import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import axios from 'axios';
import { ethers } from 'ethers';
import server, { Response } from 'express';

import { handler } from '../bot/StateRelayerBot';

require('dotenv').config({
  path: '.env',
});

const app = server();
const port = 3000;
const provider = new ethers.providers.JsonRpcProvider('http://13.214.74.236:20551/');

async function feedData() {
  const bot = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const data = await handler({
    urlNetwork: 'https://ocean.defichain.com/',
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: '0x1C0b966109152065b234692E2c18Ff75ecf89C45',
    signer: bot,
    testGasCost: false,
  });
  // console.log(bot);
  // console.log(blockNumber);
  return data;
}

app.get('/data', async (res: Response) => {
  try {
    const data = await feedData();
    console.log(data?.burnedData);
    if (data === undefined) {
      console.log('Unsuccessful');
    } else {
      console.log('Successfully updated all the INFO');
    }
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    res.status(500).send('Error: Unable to fetch data from the API');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Function to be executed every hour
async function hourlyTask() {
  try {
    const response = await axios.get('http://localhost:3000/data');
    console.log('Hourly task completed:', response.data);
  } catch (error) {
    console.error('Error in hourly task:', error);
  }
}

// Run the hourly task initially
hourlyTask();

// Schedule the hourly task to run every hour
setInterval(hourlyTask, 60 * 60 * 1000);
