# Dockerfile used to build an image to start the hardhat network
FROM node:18.15.0-alpine3.17

RUN apk --no-cache add curl git
RUN apk add --no-cache --virtual .gyp python3 make g++

WORKDIR /staterelayer

COPY package.json hardhat.config.ts .solhint.json tsconfig.json tsconfig.build.json ./
COPY contracts ./contracts

RUN npm run setup

CMD npx hardhat --config ./hardhat.config.ts node
