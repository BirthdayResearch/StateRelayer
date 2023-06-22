import { ethers } from 'ethers';

export async function getTimeStamp():Promise<number>{
    const provider = await ethers.getDefaultProvider('http://35.187.53.161:20551').getBlockNumber()
    const timeStamp =  await (await ethers.getDefaultProvider().getBlock(provider)).timestamp
    return timeStamp
}