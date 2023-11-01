// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.18;
import "../IStateRelayer.sol";

error INVALID_DBTC_PRICE(); 

// this is an example of using the state relayer that reverts whenever the value received is incorrect
// in practice, there is little chance that the value received is invalid if we process the values from 
// https://ocean.defichain.com/v0/mainnet/
// this comes with an advantage of no need to update the storage
contract ExampleRevertIfInvalid {
    address private _stateRelayer;

    constructor (address _initializedStateRelayer) {
        _stateRelayer = _initializedStateRelayer;
    }  

    function getBTCPrice() public view returns (uint256) {
        (, IStateRelayer.DEXInfo memory dex) = IStateRelayer(_stateRelayer).getDexPairInfo('dBTC-DFI');
        // check if the value is maximum or not. If it is maximum, 
        // meaning the value is invalid, revert
        if (dex.primaryTokenPrice == type(uint256).max) revert INVALID_DBTC_PRICE();

        return dex.primaryTokenPrice;
    }  
}
