import { StateRelayer__factory } from '../../generated';

const stateRelayerInterface = StateRelayer__factory.createInterface();

// example
console.log(
  stateRelayerInterface.encodeFunctionData('grantRole', [
    '0x' + '0'.repeat(64),
    '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
  ]),
);
