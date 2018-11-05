pragma solidity ^0.4.25;

import "./Ownable.sol";

/**
 * @dev Used simplier way (without OpenZeppelin Roles) 
 */
contract Whitelisted is Ownable {
    mapping(address => bool) public whitelist;
    
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "ERROR: not whitelisted");
        _;
    }
    
    function addToWhitelist(address _address) public onlyOwner {
        require(_address != address(0), "ERROR: address cannot be 0");
        require(!whitelist[_address], "ERROR: address is already whitelisted");
        
        whitelist[_address] = true;
    }
    
    function removeFromWhitelist(address _address) external onlyOwner {
        require(_address != address(0), "ERROR: address cannot be 0");
        require(whitelist[_address], "ERROR: address is not whitelisted");
        
        delete whitelist[_address];
    }
    
    function isWhitelisted(address _address) external view returns(bool) {
        return whitelist[_address];
    }   
}
