import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

error ALREADY_IN_BATCH_CALL_BY_BOT();
error ERROR_IN_LOW_LEVEL_CALLS();

contract StateRelayer is UUPSUpgradeable, AccessControlUpgradeable {
    uint256 private totalValueLockInPoolPair;
    uint256 private total24HVolume;
    uint256 private lastUpdatedVaultInfoTimestamp;
    uint256 private lastUpdatedMasterNodeInfoTimestamp;
    uint256 private lastUpdatedDexInfoTimestamp;
    uint256 private lastUpdatedBurnedInfoTimestamp;
    struct DEXInfo {
        uint256 primaryTokenPrice;
        uint256 volume24H;
        uint256 totalLiquidity;
        uint256 APR;
        uint256 firstTokenBalance;
        uint256 secondTokenBalance;
        // don't know whether we need price of pooled tokens over here
        uint256 rewards;
        uint256 commissions;
        // packed information about the decimals of each variable
        uint40 decimals;
    }
    mapping(string => DEXInfo) private DEXInfoMapping;

    struct VaultGeneralInformation {
        uint256 noOfVaults; // integer values, no decimals
        uint256 totalLoanValue;
        uint256 totalCollateralValue;
        uint256 totalCollateralizationRatio;
        uint256 activeAuctions; // integer values, no decimals
        uint40 decimals;
    }
    VaultGeneralInformation public vaultInfo;
    
    struct BurnedInformation{
        string burnAddress;
        uint256 amount; // Amount send to burn address
        string[] tokens; // Token amount send to burn address; formatted as AMOUNT@SYMBOL
        uint256 feeBurn; // Amount collected via fee burn
        uint256 emissionBurn; // Amount collected via emission burn
        uint256 auctionBurn; //Amount collected via auction burn
        uint256 paybackBurn; // Value of burn after payback
        string[] paybackBurnTokens; // Formatted as AMOUNT@SYMBOL
        string[] dexFeeTokens; // Formatted as AMOUNT@SYMBOL
        uint256 dfiPaybackFee; // Amount of DFI collected from penalty resulting from paying DUSD using DFI
        string[] dfiPaybackTokens; // Amount of tokens that are paid back; formatted as AMOUNT@SYMBOL
        string[] paybackFees; // Amount of paybacks
        string[] paybackTokens; // Amount of tokens that are paid back
        string[] dfiP2203; // Amount of tokens burned due to futureswap
        string[] dfiP2206F; // Amount of tokens burned due to DFI-to-DUSD swap
        uint40 decimals;
    }
    BurnedInformation public burnedInformation;

    struct MasterNodeInformation {
        uint256 totalValueLockedInMasterNodes;
        uint256 zeroYearLocked; // integer values, no decimals
        uint256 fiveYearLocked; // integer values, no decimals
        uint256 tenYearLocked; // integer values, no decimals
        uint40 decimals;
    }

    MasterNodeInformation private masterNodeInformation;
    bool public inBatchCallByBot;
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");

    // Events
    event UpdateDEXInfo(string[] dex, DEXInfo[] dexInfo, uint256 timeStamp, 
        uint256 totalValueLockInPoolPair, uint256 total24HVolume);
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

    function initialize(address _admin, address _bot) external initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(BOT_ROLE, _bot);
    }
    function updateDEXInfo(
        string[] calldata dex,
        DEXInfo[] calldata dexInfo,
        uint256 _totalValueLocked,
        uint256 _total24HVolume
    ) external allowUpdate {
        require(dex.length == dexInfo.length);
        for (uint256 i = 0; i < dex.length; ++i) {
            DEXInfoMapping[dex[i]] = dexInfo[i];
        }
        totalValueLockInPoolPair = _totalValueLocked;
        total24HVolume = _total24HVolume;
        uint256 _lastUpdatedDexInfo = block.timestamp;
        lastUpdatedDexInfoTimestamp = _lastUpdatedDexInfo;
        emit UpdateDEXInfo(dex, dexInfo, _lastUpdatedDexInfo, _totalValueLocked, _total24HVolume);
    }

    function updateVaultGeneralInformation(VaultGeneralInformation calldata _vaultInfo) external allowUpdate {
        vaultInfo = _vaultInfo;
        uint256 _lastUpdatedVaultInfoTimestamp = block.timestamp;
        lastUpdatedVaultInfoTimestamp = _lastUpdatedVaultInfoTimestamp;
        emit UpdateVaultGeneralInformation(_vaultInfo, _lastUpdatedVaultInfoTimestamp);
    }

    function updateMasterNodeInformation(MasterNodeInformation calldata _masterNodeInformation) external allowUpdate {
        masterNodeInformation = _masterNodeInformation;
        uint256 _lastUpdatedMasterNodeInfoTimestamp = block.timestamp;
        lastUpdatedMasterNodeInfoTimestamp = _lastUpdatedMasterNodeInfoTimestamp;
        emit UpdateMasterNodeInformation(_masterNodeInformation, _lastUpdatedMasterNodeInfoTimestamp);
    }

    function updateBurnInfo( BurnedInformation calldata _burnedInfo) external allowUpdate {
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

    function getDexInfo() external view returns(uint256, uint256, uint256){
        return (lastUpdatedDexInfoTimestamp, total24HVolume, totalValueLockInPoolPair ); 
    }

    function getDexPairInfo(string memory pair) external view returns(uint256, DEXInfo memory){
        return ( lastUpdatedDexInfoTimestamp, DEXInfoMapping[pair]);
    }

    function getVaultInfo() external view returns(uint256, VaultGeneralInformation memory){
        return (lastUpdatedVaultInfoTimestamp, vaultInfo);
    }

    function getMasterNodeInfo() external view returns(uint256, MasterNodeInformation memory){
        return (lastUpdatedMasterNodeInfoTimestamp, masterNodeInformation);
    }

    function getBurnedInfo() external view returns(uint256, BurnedInformation memory){
        return (lastUpdatedBurnedInfoTimestamp, burnedInformation);
    }
}
