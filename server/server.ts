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
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_KEY);

async function feedData() {
  const bot = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const data = await handler({
    urlNetwork: 'https://ocean.defichain.com/',
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: '0x329cB816DBE1040D00114741e9A837490097a0c6', // Sepolia test address
    signer: bot,
  });
  return data;
}

app.get('/data', async (res: Response) => {
  try {
    const data = await feedData();
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
