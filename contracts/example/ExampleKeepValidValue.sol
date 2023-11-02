// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.18;

import "../IStateRelayer.sol";

// This is an example of using the state relayer that keeps the latest valid value
// however, this will come with an additional cost of updating the state
contract ExampleKeepValidValue {
    address private _stateRelayer;

    uint256 private _latestBTCPrice;

    constructor (uint256 _initializedBTCPrice, address _initializedStateRelayer) {
        _latestBTCPrice = _initializedBTCPrice;
        _stateRelayer = _initializedStateRelayer;
    }  

    function getBTCPrice() public returns (uint256) {
        (, IStateRelayer.DEXInfo memory dex) = IStateRelayer(_stateRelayer).getDexPairInfo('dBTC-DFI');
        // check if the value is maximum or not, if it is maximum, 
        // meaning the value is invalid, revert to the previous price
        _latestBTCPrice =  dex.primaryTokenPrice == type(uint256).max ? _latestBTCPrice : dex.primaryTokenPrice;

        return _latestBTCPrice;
    }  
}
