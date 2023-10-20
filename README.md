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

Examples on how to consume the information exposed by the smart contract is showcased via [this folder](./contracts/example)

### How to deploy smart contracts via Metamask

These are instructions on how to deploy via Metamask using developer sections of Chrome:

1. Open etherscan.io, then use :
   npx hardhat run scripts/metamaskDeployment/txForStateRelayer.ts > txForStateRelayer.txt
   to print out the necessary commands for deployment of StateRelayer

2. Open etherscan.io, then use :
   npx hardhat run scripts/metamaskDeployment/txForStateRelayerProxy.ts > txForStateRelayerProxy.txt
   to print out the necessary commands for deployment of StateRelayerProxy

3. To verify, run:
   npx hardhat run --network {networkOfYourChoice} scripts/metamaskDeployment/verificationScript.ts
