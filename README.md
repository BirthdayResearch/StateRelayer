# DeFiChain <-> DeFiMetaChain State Relayer

A project comprising of smart contracts and scripts to port certain information from DeFiChain to DeFiMetaChain

### Directory Structure

```
├── bot // <-- Logic for the bot + integration test
├── contracts // <- The smart contracts + example solidity usage
├── scripts // <- Deployment scripts + gas estimation
├── tests // <- Smart contract tests
├── containers // <- Containers for integration tests
```

### How to use the package to update information on DeFiMetaChain

```typescript
import {handler} from "@waveshq/state-relayer-bot";
import { EnvironmentNetwork } from "@waveshq/walletkit-core"

handler({
    testGasCost: false,
    urlNetwork: "https://ocean.defichain.com/",
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: /* YOUR STATE RELAYER PROXY ADDRESS */,
    signer: /* signer object */,
    gasUpdateDEX: /* gas limit for dex update transaction */,
    gasUpdateMaster: /* gas limit for master node update transaction */,
    gasUpdateVault: /* gas limit for vault update transaction */
})
```

### Instruction to consume the smart contract information

Examples on how to consume the information exposed by the smart contract is showcased via [this folder](./contracts/example) and [this folder](./scripts/example)

### How to deploy your smart contract on DMCTestnet

Install the dependencies and compile smart contracts:

```
npm ci
npx hardhat compile
```

1. If you use .env file, just execute this:

```
npx hardhat run --network DMCTestnet scripts/deployment.ts
```

2. If you want to use Ledger, comment the accounts line and uncomment the ledgerAccounts line under DMCTestnet section. Execute this command:

```
npx hardhat run --network DMCTestnet scripts/deployment.ts
```

### How to manage permission for smart contracts via Metamask

There are three main functions related to this:
`grantRole(bytes32,address)`, `revokeRole(bytes32,address)` and `renounceRole(bytes32,address)`

Clone the repo.

git checkout v0.0.1, (the version that the smart contract is deployed from)

Install dependencies and compile smart contract:

```
npm ci
npx hardhat compile
```

Copy file scripts/utils/generateEncodedData.ts from main onto this branch (v0.0.1) and then
generate encoded data by executing this command line:

npx ts-node scripts/utils/generateEncodedData

After this, enable metamask to be able to show hex data.

Then when creating a transaction to send, enter the smart contract address as the recipient, then paste the generated encoded data into the "Hex data" field.

A similar flow is showcased in video/MetamaskInstruction.mov
