pragma solidity ^0.4.24;


contract Timings {
    uint256 public openTime;
    uint256 public closeTime;
    
    modifier onlyWhileOpen() {
        require(now >= openTime && now <= closeTime, "ERROR: currently not open");
        _;
    }
    
    
  /**
   * @dev Constructor function.
   * @param _timings 0 - open time, 1 - close time
   */
  constructor(uint256[] _timings) internal {
      validateTimings(_timings);
      openTime = _timings[0];
      closeTime = _timings[1];
      
  }
  
  /**
   *    PRIVATE
   */
  function validateTimings(uint256[] _timings) private view {
      for(uint8 i = 0; i < 2; i ++) {
          require(_timings[i] > now, "timings should be in future");
      }
      require(_timings[1] > _timings[0], "close time must be after open time");
  }
}
