// SPDX-License-Identifier: UNLICENSE
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

error ALREADY_IN_BATCH_CALL_BY_BOT();
error ERROR_IN_LOW_LEVEL_CALLS();

contract StateRelayer is UUPSUpgradeable, AccessControlUpgradeable {
    bytes32 public constant BOT_ROLE = keccak256('BOT_ROLE');

    // total value locked in DeFiChain DEX (USD)
    uint256 private totalValueLockInPoolPair;
    // total 24h volume of the pool pairs on DeFiChain (USD)
    uint256 private total24HVolume;
    uint256 private lastUpdatedVaultInfoTimestamp;
    uint256 private lastUpdatedMasterNodeInfoTimestamp;
    uint256 private lastUpdatedDexInfoTimestamp;
    uint256 private lastUpdatedBurnedInfoTimestamp;
    bool public inBatchCallByBot;

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
        uint40 decimals;
    }
    mapping(string => DEXInfo) private DEXInfoMapping;

    struct VaultGeneralInformation {
        // the number of open vaults
        // integer values, no decimals
        uint256 noOfVaults;
        // total loan value in USD
        uint256 totalLoanValue;
        // total collateral value in USD
        uint256 totalCollateralValue;
        uint256 totalCollateralizationRatio;
        // integer values, no decimals
        uint256 activeAuctions;
        uint40 decimals;
    }
    VaultGeneralInformation public vaultInfo;

    struct BurnedInformation {
        uint256 fee;
        uint256 auction;
        uint256 payback;
        uint256 emission;
        uint256 total;
        uint40 decimals;
    }
    BurnedInformation public burnedInformation;

    struct MasterNodeInformation {
        // the total value locked in USD in masternodes
        uint256 totalValueLockedInMasterNodes;
        // the number of master nodes that have their DFI locked for 0 years
        // integer values, no decimals
        uint256 zeroYearLocked;
        // the number of master nodes that have their DFI locked for 5 years
        // integer values, no decimals
        uint256 fiveYearLocked;
        // the number of master nodes that have their DFI locked for 10 years
        // integer values, no decimals
        uint256 tenYearLocked;
        uint40 decimals;
    }
    MasterNodeInformation private masterNodeInformation;

    // Events
    event UpdateDEXInfo(
        string[] dex,
        DEXInfo[] dexInfo,
        uint256 timeStamp,
        uint256 totalValueLockInPoolPair,
        uint256 total24HVolume
    );
    event UpdateVaultGeneralInformation(VaultGeneralInformation vaultInfo, uint256 timeStamp);
    event UpdateMasterNodeInformation(MasterNodeInformation nodeInformation, uint256 timeStamp);
    event UpdatedBurnedInformation(BurnedInformation burnedInformation, uint256 timeStamp);

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    constructor() {
        _disableInitializers();
    }

    modifier allowUpdate() {
        require(hasRole(BOT_ROLE, msg.sender) || inBatchCallByBot);
        _;
    }

    /**
     @notice function to initialize the proxy contract
     @param _admin the address to be admin of the proxy contract
     @param _bot the address to play the bot role of proxy contract
     */
    function initialize(address _admin, address _bot) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(BOT_ROLE, _bot);
    }

    /**
     @notice Function to update the dex info
     @param _dex The names of the pool pairs
     @param _dexInfo Information about the dexes
     @param _totalValueLocked TVL of the whole dex ecosystem
     @param _total24HVolume Total 24H volume of the whole dex ecosystem
     */
    function updateDEXInfo(
        string[] calldata _dex,
        DEXInfo[] calldata _dexInfo,
        uint256 _totalValueLocked,
        uint256 _total24HVolume
    ) external allowUpdate {
        require(_dex.length == _dexInfo.length);
        for (uint256 i = 0; i < _dex.length; ++i) {
            DEXInfoMapping[_dex[i]] = _dexInfo[i];
        }
        totalValueLockInPoolPair = _totalValueLocked;
        total24HVolume = _total24HVolume;
        uint256 _lastUpdatedDexInfo = block.timestamp;
        lastUpdatedDexInfoTimestamp = _lastUpdatedDexInfo;
        emit UpdateDEXInfo(_dex, _dexInfo, _lastUpdatedDexInfo, _totalValueLocked, _total24HVolume);
    }

    /**
     @notice Function to update the vault general information
     @param _vaultInfo the general vault information
     */
    function updateVaultGeneralInformation(VaultGeneralInformation calldata _vaultInfo) external allowUpdate {
        vaultInfo = _vaultInfo;
        uint256 _lastUpdatedVaultInfoTimestamp = block.timestamp;
        lastUpdatedVaultInfoTimestamp = _lastUpdatedVaultInfoTimestamp;
        emit UpdateVaultGeneralInformation(_vaultInfo, _lastUpdatedVaultInfoTimestamp);
    }

    /**
     @notice Function to update master node information
     @param _masterNodeInformation information about masternodes
    */
    function updateMasterNodeInformation(MasterNodeInformation calldata _masterNodeInformation) external allowUpdate {
        masterNodeInformation = _masterNodeInformation;
        uint256 _lastUpdatedMasterNodeInfoTimestamp = block.timestamp;
        lastUpdatedMasterNodeInfoTimestamp = _lastUpdatedMasterNodeInfoTimestamp;
        emit UpdateMasterNodeInformation(_masterNodeInformation, _lastUpdatedMasterNodeInfoTimestamp);
    }

    function updateBurnInfo(BurnedInformation calldata _burnedInfo) external allowUpdate {
        burnedInformation = _burnedInfo;
        uint256 _lastUpdatedMasterBurnedInfoTimestamp = block.timestamp;
        lastUpdatedBurnedInfoTimestamp = _lastUpdatedMasterBurnedInfoTimestamp;
        emit UpdatedBurnedInformation(_burnedInfo, _lastUpdatedMasterBurnedInfoTimestamp);
    }

    /**
     *  @notice function for the bot to update a lot of data at the same time
     *  @param funcCalls the calldata used to make call back to this smart contract
     *  (for the best security, don't grant any roles to the StateRelayerProxy contract address)
     */
    function batchCallByBot(bytes[] calldata funcCalls) external onlyRole(BOT_ROLE) {
        // just a sanity check, actually, if we don't grant any roles to the proxy address
        // we will not have a recursive batchCallByBot call.
        if (inBatchCallByBot) revert ALREADY_IN_BATCH_CALL_BY_BOT();
        inBatchCallByBot = true;
        for (uint256 i = 0; i < funcCalls.length; ++i) {
            (bool success, bytes memory returnData) = address(this).call(funcCalls[i]);
            if (!success) {
                if (returnData.length > 0) {
                    // solhint-disable-next-line max-line-length
                    // reference from openzeppelin: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/e50c24f5839db17f46991478384bfda14acfb830/contracts/utils/Address.sol#L233
                    assembly {
                        let returndata_size := mload(returnData)
                        revert(add(32, returnData), returndata_size)
                    }
                } else revert ERROR_IN_LOW_LEVEL_CALLS();
            }
        }
        inBatchCallByBot = false;
    }

    /**
     * @notice getter function to get the information about dexes
     * @return last time that information about dexes are updated
     * @return total24HVolume of all the dexes
     * @return TVL of all dexes
     */
    function getDexInfo() external view returns (uint256, uint256, uint256) {
        return (lastUpdatedDexInfoTimestamp, total24HVolume, totalValueLockInPoolPair);
    }

    /**
     * @notice Getter function to get information about a certain dex
     * @param _pair the pair to get information about
     * @return last time that information about all dexes are updated
     * @return information about that pair
     */
    function getDexPairInfo(string memory _pair) external view returns (uint256, DEXInfo memory) {
        return (lastUpdatedDexInfoTimestamp, DEXInfoMapping[_pair]);
    }

    /**
     * @notice Getter function for general vault info
     * @return last time that information about vaults is updated
     * @return information about vaults
     */
    function getVaultInfo() external view returns (uint256, VaultGeneralInformation memory) {
        return (lastUpdatedVaultInfoTimestamp, vaultInfo);
    }

    /**
     * @notice Getter function for master node information
     * @return last time that information about the master nodes is updated
     * @return master nodes information
     */
    function getMasterNodeInfo() external view returns (uint256, MasterNodeInformation memory) {
        return (lastUpdatedMasterNodeInfoTimestamp, masterNodeInformation);
    }

    function getBurnedInfo() external view returns (uint256, BurnedInformation memory) {
        return (lastUpdatedBurnedInfoTimestamp, burnedInformation);
    }
}
