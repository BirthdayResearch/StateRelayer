import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

error ALREADY_IN_BATCH_CALL_BY_BOT();
error ERROR_IN_LOW_LEVEL_CALLS();

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
    bool public inBatchCallByBot;
    bytes32 public constant BOT_ROLE = keccak256('BOT_ROLE');

    // Events
    event UpdateDEXInfo(string[] dex, DEXInfo[] dexInfo, uint256 timeStamp);
    event UpdateVaultGeneralInformation(VaultGeneralInformation vaultInfo, uint256 timeStamp);
    event UpdateMasterNodeInformation(MasternodeInformation nodeInformation, uint256 timeStamp);

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

    function updateDEXInfo(string[] calldata dex, DEXInfo[] calldata dexInfo) external allowUpdate {
        require(dex.length == dexInfo.length);
        for (uint256 i = 0; i < dex.length; ++i) {
            DEXInfoMapping[dex[i]] = dexInfo[i];
        }
        emit UpdateDEXInfo(dex, dexInfo, block.timestamp);
    }

    function updateVaultGeneralInformation(VaultGeneralInformation calldata _vaultInfo) external allowUpdate {
        vaultInfo = _vaultInfo;
        emit UpdateVaultGeneralInformation(_vaultInfo, block.timestamp);
    }

    function updateMasterNodeInformation(MasternodeInformation calldata _masterNodeInformation) external allowUpdate {
        masterNodeInformation = _masterNodeInformation;
        emit UpdateMasterNodeInformation(_masterNodeInformation, block.timestamp);
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
}
