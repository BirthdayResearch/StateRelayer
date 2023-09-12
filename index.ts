import { handler } from './bot/StateRelayerBot';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import {ethers} from 'ethers';

exports.handler = async function (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const ethereumProvider = new ethers.JsonRpcProvider(process.env.ETHEREUM_PROVIDER_URL || '')
    
    await handler({
        testGasCost: false, 
        urlNetwork: process.env.DEFICHAIN_MAINNET_URL || '',
        envNetwork: EnvironmentNetwork.MainNet,
        contractAddress: process.env.CONTRACT_ADDRESS || '',
        signer: new ethers.Wallet(process.env.PRIVATE_KEY || '', ethereumProvider )
    })

    return {
        statusCode: 200,
        body: JSON.stringify('Cron job executed successfully!')
      };
} 