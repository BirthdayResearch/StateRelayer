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
    urlNetwork: /* Defi Meta Chain RPC Provider URL */,
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: /* YOUR STATE RELAYER PROXY ADDRESS */,
    signer: /* signer object */,
    gasUpdateDEX: /* gas limit for dex update transaction */,
    gasUpdateMaster: /* gas limit for master node update transaction */,
    gasUpdateVault: /* gas limit for vault update transaction */
})
```

### Instruction to consume the smart contract information

Examples on how to consume the information exposed by the smart contract is showcased via [this folder](./contracts/example)
