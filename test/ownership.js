const VotingContract = artifacts.require("./VotingContract.sol");
import expectThrow from './helpers/expectThrow';
import {
  advanceBlock
} from './helpers/advanceToBlock';
import increaseTime, {
  duration,
  increaseTimeTo
} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';


contract('ownership', function (accounts) {
  let votingContract;

  const ADDR_1 = accounts[1];

  beforeEach("setup", async () => {
    await advanceBlock();

    const START_TIME = latestTime() + duration.minutes(1);
    const FINISH_TIME = START_TIME + duration.minutes(1);;
    votingContract = await VotingContract.new([START_TIME, FINISH_TIME]);
  });

  describe("add candidate", () => {
    it("should verify owner is able to add candidate", async () => {
      await votingContract.addCandidate(ADDR_1, "ADDR_1", 111);
    });

    it("should verify not owner is not able to add candidate", async () => {

      await expectThrow(votingContract.addCandidate(ADDR_1, "ADDR_1", 111, {
        from: ADDR_1
      }));
    });

    it("should verify owner is able to call voterVoterFor()", async () => {
      await votingContract.voterVoterFor.call(ADDR_1);
    });

    it("should verify not owner is not able to call voterVoterFor()", async () => {
      await expectThrow(votingContract.voterVoterFor(ADDR_1, {
        from: ADDR_1
      }));
    });

  });
});