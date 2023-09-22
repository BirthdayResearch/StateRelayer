interface IStateRelayer {
    struct DEXInfo {
        // the price of the primary token in USDT/ USD
        uint256 primaryTokenPrice;
        // the 24H trading volume of the pair (in USD)
        uint256 volume24H;
        // the total liquidity of the pair (in USD)
        uint256 totalLiquidity;
        // the APR (in percentage)
        // TODO: may remove this variable later,
        // as it seems that APR = commissions + decimals
        uint256 APR;
        // the number of first tokens in the pool
        uint256 firstTokenBalance;
        // the number of second tokens in the pool
        uint256 secondTokenBalance;
        // the rewards percentage
        uint256 rewards;
        // the commissions percentage
        uint256 commissions;
    }

    struct VaultGeneralInformation {
        // the number of open vaults
        // integer values, no decimals
        uint256 noOfVaultsNoDecimals;
        // total loan value in USD
        uint256 totalLoanValue;
        // total collateral value in USD
        uint256 totalCollateralValue;
        uint256 totalCollateralizationRatio;
        // integer values, no decimals
        uint256 activeAuctionsNoDecimals;
    }

    struct MasterNodeInformation {
        // the total value locked in USD in masternodes
        uint256 totalValueLockedInMasterNodes;
        // the number of master nodes that have their DFI locked for 0 years
        // integer values, no decimals
        uint256 zeroYearLockedNoDecimals;
        // the number of master nodes that have their DFI locked for 5 years
        // integer values, no decimals
        uint256 fiveYearLockedNoDecimals;
        // the number of master nodes that have their DFI locked for 10 years
        // integer values, no decimals
        uint256 tenYearLockedNoDecimals;
    }

    function getDexInfo() external view returns (uint256, uint256, uint256);

    function getDexPairInfo(string memory _pair) external view returns (uint256, DEXInfo memory);

    function getVaultInfo() external view returns (uint256, VaultGeneralInformation memory);

    function getMasterNodeInfo() external view returns (uint256, MasterNodeInformation memory);
}

contract ExampleUsage {
    address private _stateRelayer;

    uint256 private _latestBTCPrice;

    constructor (uint256 _initialBTCPrice) {
        _latestBTCPrice = _initialBTCPrice;
    }  

    function getBTCPrice() public returns (uint256) {
        (, IStateRelayer.DEXInfo memory dex) = IStateRelayer(_stateRelayer).getDexPairInfo('dBTC-DFI');
        // check if the value is maximum or not, if it is maximum, meaning the value is invalid, revert to the previous price
        _latestBTCPrice =  dex.primaryTokenPrice == type(uint256).max ? _latestBTCPrice : dex.primaryTokenPrice;

        return _latestBTCPrice;
    }  
}