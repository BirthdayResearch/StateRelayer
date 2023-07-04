// SPDX-License-Identifier: Unlicense
contract MockContract{
    address public ADMIN;
    uint public number;

    modifier onlyAdmin {
        require(msg.sender==ADMIN);
        _;
    }
    constructor(address admin){
        ADMIN = admin;
    }

    function updateState(uint256 _number) public onlyAdmin{
        number = _number;
    }
}