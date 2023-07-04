import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';

error ALREADY_IN_BATCH_CALL_BY_BOT();
error ERROR_IN_LOW_LEVEL_CALLS();

contract MockRelayer is UUPSUpgradeable, AccessControlUpgradeable {
    address public ADMIN;
    uint256 public number;

    modifier onlyAdmin() {
        require(msg.sender == ADMIN);
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin) external initializer {
        ADMIN = _admin;
    }

    function updateState(uint256 _number) public onlyAdmin {
        number = _number;
    }

    function _authorizeUpgrade(address newImplementation) internal virtual override {}
}
