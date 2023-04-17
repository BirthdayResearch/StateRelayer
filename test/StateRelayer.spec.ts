import {ethers} from "hardhat"
import {expect} from "chai"
import { StateRelayer, StateRelayer__factory } from "../typechain-types";
import {Signer} from "ethers"
describe("Test state relayer", () => {
    let stateRelayerProxy: StateRelayer;
    let admin : Signer;
    let bot: Signer;
    before(async () => {
        const signers = await ethers.getSigners();
        admin = signers[0];
        bot = signers[1];
        const stateRelayerImplementationFactory = await ethers.getContractFactory("StateRelayer");
        const stateRelayerImplementation = await stateRelayerImplementationFactory.deploy();
        const stateRelayerProxyFactory = await ethers.getContractFactory("StateRelayerProxy");
        const encodedInitilization = StateRelayer__factory.createInterface().encodeFunctionData("initialize", [await admin.getAddress(), await bot.getAddress()]);
        const stateRelayerProxyAddress = (await stateRelayerProxyFactory.deploy(stateRelayerImplementation.address, encodedInitilization)).address;
        stateRelayerProxy = stateRelayerImplementationFactory.attach(stateRelayerProxyAddress);
    })
    it("Test", () => {
        
    })
})