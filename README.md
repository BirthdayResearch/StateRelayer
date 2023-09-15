# DeFiChain <-> DeFiMetaChain State Relayer

A project comprising of smart contracts and scripts to port certain information from DeFiChain to DeFiMetaChain

## How to create a zip file to upload onto Lambda AWS

npm run clean && npm i && npm run build:webpack && cd distWebpack && zip lambdafunction.zip index.js

distWebpack/lambdafunction.zip is the the one we need to use to upload onto lambda