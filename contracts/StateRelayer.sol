import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract StateRelayer is UUPSUpgradeable, AccessControlUpgradeable {
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
        uint256 lastUpdated;
        // packed information about the decimals of each variable
        uint40 decimals;
    }
    mapping(string => DEXInfo) public DEXInfoMapping;
    struct VaultGeneralInformation {
        uint256 noOfVaults;
        uint256 totalLoanValue;
        uint256 totalCollateralValue;
        uint256 totalCollateralizationRatio;
        uint256 activeAuctions;
        uint256 lastUpdated;
    }
    VaultGeneralInformation public vaultInfo;
    struct MasternodeInformation {
        uint256 tvl;
        uint256 zeroYearTVL;
        uint256 fiveYearTVL;
        uint256 tenYearTVL;
        uint256 lastUpdated;
    }

    MasternodeInformation public masterNodeInformation;
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
        DEXInfo[] calldata dexInfo
    ) external allowUpdate {
        require(dex.length == dexInfo.length);
        for (uint256 i = 0; i < dex.length; i++) {
            DEXInfoMapping[dex[i]] = dexInfo[i];
        }
        emit UpdateDEXInfo(dex, dexInfo, block.timestamp);
    }

    function updateVaultGeneralInformation(
        VaultGeneralInformation calldata _vaultInfo
    ) external allowUpdate {
        vaultInfo = _vaultInfo;
        emit UpdateVaultGeneralInformation(_vaultInfo, block.timestamp);
    }

    function updateMasterNodeInformation(
        MasternodeInformation calldata _masterNodeInformation
    ) external allowUpdate {
        masterNodeInformation = _masterNodeInformation;
        emit UpdateMasterNodeInformation(_masterNodeInformation, block.timestamp);
    }

    function multiCall(bytes[] calldata funcCalls) external onlyRole(BOT_ROLE) {
        inMultiCall = true;
        for (uint256 i = 0; i < funcCalls.length; i++) {
            (bool success, ) = address(this).call(funcCalls[i]);
            require(success, "There are some errors in low-level calls");
        }
        inMultiCall = false;
    }
}
