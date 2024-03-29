# Dockerfile used to build an image to start the hardhat network
FROM node:21.1.0-alpine3.17

RUN apk --no-cache add curl git
RUN apk add --no-cache --virtual .gyp python3 make g++ libusb-dev linux-headers eudev-dev

WORKDIR /staterelayer

COPY package.json package-lock.json hardhat.config.ts .solhint.json tsconfig.json tsconfig.build.json ./
COPY contracts ./contracts

RUN npm install && npm run compile

CMD npx hardhat --config ./hardhat.config.ts node
