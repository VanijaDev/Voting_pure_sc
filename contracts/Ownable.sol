pragma solidity ^0.4.25;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public _owner;
  
  constructor() internal {
    _owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == _owner, "ERROR: not owner address");
    _;
  }
}