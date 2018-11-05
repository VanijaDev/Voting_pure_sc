pragma solidity ^0.4.25;

import "./Whitelisted.sol";
import "./Timings.sol";
import "./SafeMath.sol";

//  TODO: timings remove updateClosing
//  TODO: remove tests funcs
//  TODO: whitelist -> external


contract VotingContract is Whitelisted, Timings {
    using SafeMath for uint256;
    
    struct Vote {
        uint256 timestamp;
        address voter;
    }
    
    struct Candidate {
        address addr;
        string name;
        uint8 age;
        Vote[] votes;
    }
    
    mapping(address => address) private candidateForVoter;
    
    mapping(address => Candidate) public candidateInfo;
    address[] public candidates;
    
    modifier candidateExists(address _address) {
        require(candidateInfo[_address].age > 0, "ERROR: candidate does not exist");
        _;
    }
    
    function testAddCandidates() public {
        candidateInfo[address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148)].addr = address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148);
        candidateInfo[address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148)].name = "148";
        candidateInfo[address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148)].age = 148;
        candidates.push(address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148));
        
        candidateInfo[address(0x583031d1113ad414f02576bd6afabfb302140225)].addr = address(0x583031d1113ad414f02576bd6afabfb302140225);
        candidateInfo[address(0x583031d1113ad414f02576bd6afabfb302140225)].name = "225";
        candidateInfo[address(0x583031d1113ad414f02576bd6afabfb302140225)].age = 225;
        candidates.push(address(0x583031d1113ad414f02576bd6afabfb302140225));
        
        candidateInfo[address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db)].addr = address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db);
        candidateInfo[address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db)].name = "2db";
        candidateInfo[address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db)].age = 2;
        candidates.push(address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db));
    }
    
    function testAddWhitelist() public {
        super.addToWhitelist(address(0xca35b7d915458ef540ade6068dfe2f44e8fa733c));
        super.addToWhitelist(address(0x14723a09acff6d2a60dcdf7aa4aff308fddc160c));
        super.addToWhitelist(address(0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db));
        super.addToWhitelist(address(0x583031d1113ad414f02576bd6afabfb302140225));
        super.addToWhitelist(address(0xdd870fa1b7c4700f2bd7f44238821c26f7392148));
    }
    
    constructor(uint256[] _timings) Timings(_timings) public {}
    
    function candidateCount() public view returns(uint count) {
        count = candidates.length;
    }
    
  function addCandidate(address _address, string _name, uint8 _age) external onlyOwner {
      require(_address != address(0), "ERROR: candidate address cannot be 0");
      require(bytes(_name).length != 0, "ERROR: candidate name cannot be empty");
      require(_age > 0, "ERROR: candidate age cannot be 0");
      require(candidateInfo[_address].age == 0, "ERROR: candidate address already added");
      
      candidateInfo[_address].addr = _address;
      candidateInfo[_address].name = _name;
      candidateInfo[_address].age = _age;
      
      candidates.push(_address);
  }
  
  function vote(address _address) external onlyWhileOpen onlyWhitelisted candidateExists(_address) {
      require(candidateForVoter[msg.sender] == address(0), "ERROR: already voted");
      
      candidateForVoter[msg.sender] = _address;
      
      candidateInfo[_address].votes.push(Vote(now, msg.sender));
  }
  
  /**
   * @dev Fucntion for getting vote choice for voter.
   * @param _address Address of voter
   * @return Address of candidate voted for
   */
  function voterVoterFor(address _address) public view onlyOwner returns(address candidate) {
      candidate = candidateForVoter[_address];
  }
  
  /**
   * @dev Fucntion to get percentage of votes given for candidate.
   * @param _address Address of voter
   * @param _fromTime Search from time (use both times as 0 for wntire campaign)
   * @param _toTime Search until time (use both times as 0 for wntire campaign)
   * @return Percentage of votes for candidate
   */
  function percentageFor(address _address, uint256 _fromTime, uint256 _toTime) external view returns(uint256) {
      //    used for loop instead of storage uint256 votesTotal, because:
      //    1. external view are consume no gas
      //    2. calculations take longer time, but this function should not be instantaneous
      //    3. storage uint256 votesTotal will cost gas
      //    4. mul(10000): 100 - percent, 100 - show 2 decimals. On UI you need to divide returned result by 100.
      
      require(candidateInfo[_address].age > 0, "ERROR: no candidate with provided address");
      
      uint256 totalVotes;
      uint256 candidateVotes;
      
      if(_fromTime == 0 && _toTime == 0) {
        for(uint256 i = 0; i < candidates.length; i ++) {
          totalVotes = totalVotes.add(candidateInfo[candidates[i]].votes.length);
        }
          
        candidateVotes = candidateInfo[_address].votes.length;
      }
      else {
        for(uint256 j = 0; j < candidates.length; j ++) {
            Vote[] storage votes = candidateInfo[candidates[j]].votes;
            for(uint256 k = 0; k < votes.length; k ++) {
                if(votes[k].timestamp >= _fromTime && votes[k].timestamp <= _toTime) {
                    totalVotes = totalVotes.add(1);
                    
                    if(candidates[j] == _address) {
                        candidateVotes = candidateVotes.add(1);
                    }
                }
                else if(votes[k].timestamp > _toTime) {
                    break;
                }
            }
        }
      }
      
      require(totalVotes > 0, "ERROR: no votes yet");
      return candidateVotes.mul(10000).div(totalVotes);
  }
  
  function voteCountFor(address _address) external view returns(uint256) {
      return candidateInfo[_address].votes.length;
  }
  
  function winner() external view returns(address[] memory winners) {
      Candidate[] memory winnersTmp = new Candidate[](candidates.length);
      uint256 winnersCount;
    
      for(uint256 i = 0; i < candidates.length; i++) {
          if(candidateInfo[candidates[i]].votes.length == winnersTmp[0].votes.length) {
            winnersTmp[winnersCount] = candidateInfo[candidates[i]];
            winnersCount = winnersCount.add(1);
          }
          else if(candidateInfo[candidates[i]].votes.length > winnersTmp[0].votes.length) {
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
