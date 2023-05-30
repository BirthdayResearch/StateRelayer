
import {expect} from "chai"
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import {deployContract} from './utils/deployment'
import { StateRelayer } from "../generated";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe("State relayer deployment test", () => {
    let stateRelayerProxy:StateRelayer;
    let admin: SignerWithAddress;
    let bot: SignerWithAddress;

    it("Admin address should be admin address signer", async() => {
        ({stateRelayerProxy, admin} = await loadFixture(deployContract))
        const adminRole = await stateRelayerProxy.DEFAULT_ADMIN_ROLE()
        expect(await stateRelayerProxy.hasRole(adminRole, admin.address)).to.be.equal(true)
    })
    
    it("Bot address should be bot address signer", async() => {
        ({stateRelayerProxy, bot} = await loadFixture(deployContract))
        const botRole = await stateRelayerProxy.BOT_ROLE()
        expect(await stateRelayerProxy.hasRole(botRole, bot.address)).to.be.equal(true)
    })
})