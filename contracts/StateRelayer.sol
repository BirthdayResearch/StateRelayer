import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StateRelayer is UUPSUpgradeable, AccessControlUpgradeable {
    uint256 private totalValueLockInPoolPair;
    uint256 private total24HVolume;
    uint256 private lastUpdatedVaultInfo;
    uint256 private lastUpdatedMasterNodeInfo;
    uint256 private lastUpdatedDexInfo;
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
        uint256 noOfVaults;
        uint256 totalLoanValue;
        uint256 totalCollateralValue;
        uint256 totalCollateralizationRatio;
        uint256 activeAuctions;
        uint40 decimals;
    }
    VaultGeneralInformation private vaultInfo;
    struct MasternodeInformation {
        uint256 totalValueLockedInMasterNodes;
        uint256 zeroYearLocked;
        uint256 fiveYearLocked;
        uint256 tenYearLocked;
        uint40 decimals;
    }

    MasternodeInformation private masterNodeInformation;
    bool public inMultiCall;
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");

    // Events
    event UpdateDEXInfo(string[] dex, DEXInfo[] dexInfo, uint256 timeStamp);
    event UpdateVaultGeneralInformation(VaultGeneralInformation vaultInfo, uint256 timeStamp);
    event UpdateMasterNodeInformation(MasternodeInformation nodeInformation, uint256 timeStamp);

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    constructor() {
        _disableInitializers();
    }

    modifier allowUpdate() {
        require(hasRole(BOT_ROLE, msg.sender) || inMultiCall);
        _;
    }

    function initialize(
        address _admin,
        address _bot
    ) external initializer {
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
        for (uint256 i = 0; i < dex.length; i++) {
            DEXInfoMapping[dex[i]] = dexInfo[i];
        }
        totalValueLockInPoolPair = _totalValueLocked;
        total24HVolume = _total24HVolume;
        uint256 _lastUpdatedDexInfo = block.timestamp;
        lastUpdatedDexInfo = _lastUpdatedDexInfo;
        emit UpdateDEXInfo(dex, dexInfo, _lastUpdatedDexInfo);
    }

    function updateVaultGeneralInformation(
        VaultGeneralInformation calldata _vaultInfo
    ) external allowUpdate {
        vaultInfo = _vaultInfo;
        uint256 _lastUpdatedVaultInfo = block.timestamp;
        lastUpdatedVaultInfo = _lastUpdatedVaultInfo;
        emit UpdateVaultGeneralInformation(_vaultInfo, _lastUpdatedVaultInfo);
    }

    function updateMasterNodeInformation(
        MasternodeInformation calldata _masterNodeInformation
    ) external allowUpdate {
        masterNodeInformation = _masterNodeInformation;
        uint256 _lastUpdatedMasterNodeInfo = block.timestamp;
        lastUpdatedMasterNodeInfo = _lastUpdatedMasterNodeInfo;
        emit UpdateMasterNodeInformation(_masterNodeInformation, _lastUpdatedMasterNodeInfo);
    }

    function multiCall(bytes[] calldata funcCalls) external onlyRole(BOT_ROLE) {
        inMultiCall = true;
        for (uint256 i = 0; i < funcCalls.length; i++) {
            (bool success, ) = address(this).call(funcCalls[i]);
            require(success, "There are some errors in low-level calls");
        }
        inMultiCall = false;
    }

    function getDexInfo() external view returns(uint256, uint256, uint256){
        return (totalValueLockInPoolPair, total24HVolume, lastUpdatedDexInfo); 
    }

    function getDexPairInfo(string memory pair) external view returns(uint256, DEXInfo memory){
        return ( lastUpdatedDexInfo, DEXInfoMapping[pair]);
    }

    function getVaultInfo() external view returns(uint256, VaultGeneralInformation memory){
        return (lastUpdatedVaultInfo, vaultInfo);
    }

    function getMasterNodeInfo() external view returns(uint256, MasternodeInformation memory){
        return (lastUpdatedMasterNodeInfo, masterNodeInformation);
    }
}
