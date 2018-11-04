pragma solidity ^0.4.25;

import "./Whitelisted.sol";
import "./Timings.sol";
import "./SafeMath.sol";


contract VotingContract is Whitelisted, Timings {
    using SafeMath for uint256;
    
    struct Candidate {
        address addr;
        string name;
        uint8 age;
        uint256 votes;
    }
    
    mapping(address => address) private votes;
    
    mapping(address => Candidate) public candidateInfo;
    address[] public candidates;
    
    modifier candidateExists(address _address) {
        require(candidateInfo[_address].age > 0, "ERROR: candidate does not exist");
        _;
    }
    
    constructor(uint256[] _timings) Timings(_timings) public {
      
    }
    
    function candidateCount() public view returns(uint count) {
        count = candidates.length;
    }
    
  function addCandidate(address _address, string _name, uint8 _age) public onlyOwner {
      require(_address != address(0), "ERROR: candidate address cannot be 0");
      require(bytes(_name).length != 0, "ERROR: candidate name cannot be empty");
      require(_age > 0, "ERROR: candidate age cannot be 0");
      require(candidateInfo[_address].age == 0, "ERROR: candidate address already added");
      
    //  if more params, can be uesed approach below with slightly better gas cost
    //   candidateInfo[_address].name = _name;
    //   candidateInfo[_address].age = _age;
      Candidate memory candidate = Candidate(_address, _name, _age, 0);
      candidateInfo[_address] = candidate;
      candidates.push(_address);
  }
  
  function vote(address _address) public onlyWhileOpen onlyWhitelisted candidateExists(_address) {
      require(votes[msg.sender] == address(0), "ERROR: already voted");
      
      votes[msg.sender] = _address;
      
      candidateInfo[_address].votes = candidateInfo[_address].votes.add(1);
  }
  
  /**
   * @dev Fucntion for getting vote result.
   * @param _address Address of voter
   * @return Address of candidate voted for
   */
  function candidateVoted(address _address) public view onlyOwner returns(address candidate) {
      candidate = votes[_address];
  }
  
  function test(uint256 a, uint256 b) public pure returns(uint256) {
      return b.mul(10000).div(a);
  }
  
  function percentageFor(address _address) public view returns(uint256) {
      return candidateInfo[_address].votes.mul(10000).div(candidates.length);
  }
  
  function winner() public view returns(address[] memory winners) {
      Candidate[] memory winnersTmp = new Candidate[](candidates.length);
      uint256 winnersCount;
    
      for(uint256 i = 0; i < candidates.length; i++) {
          if(candidateInfo[candidates[i]].votes == winnersTmp[0].votes) {
            winnersTmp[winnersCount] = candidateInfo[candidates[i]];
            winnersCount = winnersCount.add(1);
          }
          else if(candidateInfo[candidates[i]].votes > winnersTmp[0].votes) {
            winnersTmp = new Candidate[](candidates.length);
            winnersTmp[0] = candidateInfo[candidates[i]];
            winnersCount = 1;
          }
          
      }
      
      winners = new address[](winnersCount);
      for(uint256 j = 0; j < winnersCount; j++) {
          winners[j] = winnersTmp[j].addr;
      }
  }
  
}
