import { IStateRelayer__factory } from '../../generated';
import { ethers } from 'ethers';

const ADDRESS = 'STATE_RELAYER_ADDRESS_HERE';
const PROVIDER_URL = 'PROVIDER_URL_HERE';
let provider = new ethers.JsonRpcProvider(PROVIDER_URL);

IStateRelayer__factory.connect(ADDRESS, provider)
  .getDexPairInfo('dBTC-DFI')
  .then((dexPairInfo) => {
    let primaryTokenPrice = dexPairInfo[1][0];
    if (primaryTokenPrice === 2n ** 256n - 1n) {
      throw Error('Invalid price');
    } else {
      console.log(`Price of dBTC is ${primaryTokenPrice}`);
      // other processing here
    }
  });
