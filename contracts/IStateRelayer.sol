// SPDX-License-Identifier: UNLICENSE
pragma solidity ^0.8.18;

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

    /**
     * @notice Getter function to get the information about dexes
     * @return Last time that information about dexes are updated
     * @return Total24HVolume of all the dexes
     * @return TVL of all dexes
     */
    function getDexInfo() external view returns (uint256, uint256, uint256);

    /**
     * @notice Getter function to get information about a certain dex
     * @param _pair The pair to get information about
     * @return Last time that information about all dexes are updated
     * @return Information about that pair
     */
    function getDexPairInfo(string memory _pair) external view returns (uint256, DEXInfo memory);

    /**
     * @notice Getter function for general vault info
     * @return Last time that information about vaults is updated
     * @return Information about vaults
     */
    function getVaultInfo() external view returns (uint256, VaultGeneralInformation memory);

    /**
     * @notice Getter function for master node information
     * @return Last time that information about the master nodes is updated
     * @return Master nodes information
     */
    function getMasterNodeInfo() external view returns (uint256, MasterNodeInformation memory);

}