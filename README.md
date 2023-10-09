# DeFiChain <-> DeFiMetaChain State Relayer

A project comprising of smart contracts and scripts to port certain information from DeFiChain to DeFiMetaChain

### Direcrtory Structure

```
├── bot // <-- Logic for the bot + integration test
├── contracts // <- The smart contracts + example solidity usage
├── scripts // <- Deployment scripts + gas estimation
├── tests // <- Smart contract tests
├── containers // <- Containers for integration tests
```

### How to use the package

```typescript
import {handler} from "@waveshq/state-relayer-bot";
import { EnvironmentNetwork } from "@waveshq/walletkit-core"

handler({
    testGasCost: false,
    urlNetwork: /* RPC Provider URL */,
    envNetwork: EnvironmentNetwork.MainNet,
    contractAddress: /* YOUR STATE RELAYER PROXY ADDRESS */,
    signer: /* signer object */,
    gasUpdateDEX: /* gas limit for dex update transaction */,
    gasUpdateMaster: /* gas limit for master node update transaction */,
    gasUpdateVault: /* gas limit for vault update transaction */
})
```
