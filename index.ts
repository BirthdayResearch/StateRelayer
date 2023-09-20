import { handler as botRelayer } from './bot/StateRelayerBot';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import { ethers } from 'ethers';
import axios from 'axios';

// the secret should have the following fields:
// ETHEREUM_PROVIDER_URL
// CONTRACT_ADDRESS
// PRIVATE_KEY
export const handler = async function (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  const awsSessionToken = process.env.AWS_SESSION_TOKEN;
  const secretsExtensionHttpPort = '2773';
  const secretName = 'state_relayer_secret';
  const headers = {
    'X-Aws-Parameters-Secrets-Token': awsSessionToken,
  };

  const secretsExtensionEndpoint = `http://localhost:${secretsExtensionHttpPort}/secretsmanager/get?secretId=${secretName}`;

  const response = await axios.get(secretsExtensionEndpoint, { headers });
  const secretObj = JSON.parse(response.data.SecretString);
  const ethereumProvider = new ethers.JsonRpcProvider(secretObj.ETHEREUM_PROVIDER_URL);

  await botRelayer({
    testGasCost: false,
    urlNetwork: 'https://ocean.defichain.com/',
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: secretObj.CONTRACT_ADDRESS,
    signer: new ethers.Wallet(secretObj.PRIVATE_KEY, ethereumProvider),
  });

  return {
    statusCode: 200,
    body: JSON.stringify('Lambda executed successfully!'),
  };
};
