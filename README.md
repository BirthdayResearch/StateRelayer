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

### Smart contract addresses deployed by BirthdayResearch team

#### MetaChain Mainnet

StateRelayerProxy: [0xa075dC93D00ac14f4a7416C03cAbec4728586760](https://meta.defiscan.live/address/0xa075dC93D00ac14f4a7416C03cAbec4728586760)

StateRelayer: [0x970F740feB2D14926881d51873Eb81E9183E7B18](https://meta.defiscan.live/address/0x970F740feB2D14926881d51873Eb81E9183E7B18)

#### MetaChain Testnet

StateRelayerProxy: [0xA6A853DDbfB6C85d3584E33313628555BA85753B](https://meta.defiscan.live/address/0xA6A853DDbfB6C85d3584E33313628555BA85753B?network=TestNet)
