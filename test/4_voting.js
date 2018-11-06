const VotingContract = artifacts.require("./VotingContract.sol");
const BigNumber = require("bignumber.js");

import expectThrow from './helpers/expectThrow';
import {
  advanceBlock
} from './helpers/advanceToBlock';
import increaseTime, {
  duration,
  increaseTimeTo
} from './helpers/increaseTime';
import latestTime from './helpers/latestTime';


contract('voting', function (accounts) {
  let votingContract;

  const ADDR_1 = accounts[1];
  const ADDR_2 = accounts[2];
  const ADDR_3 = accounts[3];
  const ADDR_4 = accounts[4];
  const ADDR_5 = accounts[5];

  const CANDIDATE_1 = accounts[9];
  const CANDIDATE_2 = accounts[8];
  const CANDIDATE_3 = accounts[7];
  const CANDIDATE_4 = accounts[6];

  beforeEach("setup", async () => {
    await advanceBlock();

    const START_TIME = latestTime() + duration.minutes(1);
    const FINISH_TIME = START_TIME + duration.hours(1);
    votingContract = await VotingContract.new([START_TIME, FINISH_TIME]);

    await increaseTimeTo(START_TIME);

    await votingContract.addToWhitelist(ADDR_1);
    await votingContract.addToWhitelist(ADDR_2);
    await votingContract.addToWhitelist(ADDR_3);
    await votingContract.addToWhitelist(ADDR_4);
    await votingContract.addToWhitelist(ADDR_5);

    await votingContract.addCandidate(CANDIDATE_1, "CANDIDATE_1", 111);
  });

  describe("add candidate", () => {
    it("should validate candidate data", async () => {
      await votingContract.addCandidate(ADDR_1, "ADDR_1", 111);

      let candidate = await votingContract.candidateInfo.call(ADDR_1);
      assert.equal(candidate[0], ADDR_1, "wrong address of candidate");
      assert.equal(candidate[1], "ADDR_1", "wrong name of candidate");
      assert.equal(candidate[2], 111, "wrong age of candidate");
    });

    it("should increase candidate amount", async () => {
      assert.equal(new BigNumber(await votingContract.candidateCount.call()).toNumber(), 1, "should be 1 candidate");

      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);
      assert.equal(new BigNumber(await votingContract.candidateCount.call()).toNumber(), 2, "should be 2 candidates");
    });
  });

  describe("voting action", () => {
    it("should increase vote counter", async () => {
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      assert.equal(new BigNumber(await votingContract.voteCountFor.call(CANDIDATE_1)).toNumber(), 1, "votes should be 1");

      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_2
      });
      assert.equal(new BigNumber(await votingContract.voteCountFor.call(CANDIDATE_1)).toNumber(), 2, "votes should be 2");
    });

    it("should validate voter can vote only once", async () => {
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      await expectThrow(votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      }));
    });

    it("should reflect correct candidate for voter", async () => {
      assert.equal(await votingContract.voterVoterFor.call(ADDR_1), 0x0, "voter should not be voted yet");

      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      assert.equal(await votingContract.voterVoterFor.call(ADDR_1), CANDIDATE_1, "voter should be voted for CANDIDATE_1");
    });
  });

  describe("voting results", () => {
    it("should calculate the winner correctly", async () => {

      //  winner = CANDIDATE_1, no votes yet
      assert.equal((await votingContract.winner.call()).length, 1, "should be 1 winner == CANDIDATE_1, although none has voted");

      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);

      //  winner = CANDIDATE_2
      await votingContract.vote(CANDIDATE_2, {
        from: ADDR_2
      });
      let winners = await votingContract.winner.call();
      assert.equal(winners.length, 1, "should be 1 winner");
      assert.include(winners, CANDIDATE_2, "winner should be CANDIDATE_2");

      // winner = CANDIDATE_1 & CANDIDATE_2
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      winners = await votingContract.winner.call();
      assert.equal(winners.length, 2, "should be 2 even winners");
      assert.include(winners, CANDIDATE_1, "should CANDIDATE_1");
      assert.include(winners, CANDIDATE_2, "should CANDIDATE_2");

      // winner = CANDIDATE_3
      await votingContract.addCandidate(CANDIDATE_3, "CANDIDATE_3", 333);

      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_3
      });
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_4
      });
      winners = await votingContract.winner.call();
      assert.equal(winners.length, 1, "should be 1 winner again");
      assert.include(winners, CANDIDATE_3, "should CANDIDATE_3");
    });

    it("should calculate percentage correct - throw if no candidate", async () => {
      await expectThrow(votingContract.percentageFor.call(CANDIDATE_2, 0, 0));
    });

    it("should calculate percentage correct - start to middle", async () => {
      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);
      await votingContract.addCandidate(CANDIDATE_3, "CANDIDATE_3", 333);

      //  0 - TIME_1
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      let time_1 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_1);

      //  CANDIDATE_1 = 100%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, time_1)).toNumber(), 10000, "should be 100 for CANDIDATE_1");
      //  CANDIDATE_2 = 0%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, time_1)).toNumber(), 0, "should be 0 for CANDIDATE_2");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  0 - TIME_2
      await votingContract.vote(CANDIDATE_2, {
        from: ADDR_2
      });
      let time_2 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_2 + duration.minutes(1));

      //  CANDIDATE_1 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, time_2)).toNumber(), 5000, "should be 50 for CANDIDATE_1");
      //  CANDIDATE_2 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, time_2)).toNumber(), 5000, "should be 50 for CANDIDATE_2");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  0 - TIME_3
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_3
      });
      let time_3 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_3 + duration.minutes(1));

      //  CANDIDATE_1 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, time_3)).toNumber(), 3333, "should be 3333 for CANDIDATE_1");
      //  CANDIDATE_2 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, time_3)).toNumber(), 3333, "should be 3333 for CANDIDATE_2");
      //  CANDIDATE_3 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, 0, time_3)).toNumber(), 3333, "should be 3333 for CANDIDATE_3");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  0 - TIME_4
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_4
      });
      let time_4 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_4 + duration.minutes(1));

      //  CANDIDATE_1 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, time_4)).toNumber(), 2500, "should be 2500 for CANDIDATE_1");
      //  CANDIDATE_2 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, time_4)).toNumber(), 2500, "should be 2500 for CANDIDATE_2");
      //  CANDIDATE_3 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, 0, time_4)).toNumber(), 5000, "should be 5000 for CANDIDATE_3");
      await increaseTimeTo(latestTime() + duration.minutes(1));
    });

    it("should calculate percentage correct - middle to middle", async () => {
      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);
      await votingContract.addCandidate(CANDIDATE_3, "CANDIDATE_3", 333);

      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });

      let time_1 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_1);

      //  TIME_1 - TIME_2
      await votingContract.vote(CANDIDATE_2, {
        from: ADDR_2
      });
      let time_2 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_2 + duration.minutes(1));

      //  CANDIDATE_1 = 0%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, time_1, time_2)).toNumber(), 0, "should be 0 for CANDIDATE_1");
      //  CANDIDATE_2 = 100%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, time_1, time_2)).toNumber(), 10000, "should be 50 for CANDIDATE_2");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  TIME_2 - TIME_3
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_3
      });
      let time_3 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_3 + duration.minutes(1));

      //  CANDIDATE_1 = 0%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, time_2, time_3)).toNumber(), 10000, "should be 100 for CANDIDATE_1");
      //  CANDIDATE_2 = 100%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, time_2, time_3)).toNumber(), 0, "should be 0 for CANDIDATE_2");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  TIME_3 - TIME_4
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_4
      });

      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_5
      });
      let time_4 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_4 + duration.minutes(1));

      //  CANDIDATE_1 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, time_3, time_4)).toNumber(), 5000, "should be 5000 for CANDIDATE_1");
      //  CANDIDATE_3 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, time_3, time_4)).toNumber(), 5000, "should be 50000 for CANDIDATE_3");
      await increaseTimeTo(latestTime() + duration.minutes(1));
    });

    it("should calculate percentage correct - middle to close", async () => {
      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);
      await votingContract.addCandidate(CANDIDATE_3, "CANDIDATE_3", 333);

      //  TIME_1 - 0
      let time_1 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_1);

      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      let time_2 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_2);

      //  CANDIDATE_1 = 100%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, time_1, time_2)).toNumber(), 10000, "should be 1000 for CANDIDATE_1");
      //  CANDIDATE_2 = 0%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, time_1, time_2)).toNumber(), 0, "should be 0 for CANDIDATE_2");

      let time_3 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_3);

      //  TIME_3 - 0
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_2
      });
      await votingContract.vote(CANDIDATE_2, {
        from: ADDR_3
      });
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_4
      });
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_5
      });

      let time_4 = latestTime() + duration.minutes(1);
      await increaseTimeTo(time_4);
      //  CANDIDATE_1 = 40%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, time_1, time_4)).toNumber(), 4000, "should be 4000 for CANDIDATE_1");
      //  CANDIDATE_2 = 20%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, time_1, time_4)).toNumber(), 2000, "should be 20000 for CANDIDATE_2");
      //  CANDIDATE_3= 40%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, time_1, time_4)).toNumber(), 4000, "should be 30000 for CANDIDATE_3");
    });

    it("should calculate percentage correct - open to close", async () => {
      await votingContract.addCandidate(CANDIDATE_2, "CANDIDATE_2", 222);
      await votingContract.addCandidate(CANDIDATE_3, "CANDIDATE_3", 333);

      //  1
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_1
      });
      //  CANDIDATE_1 = 100%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, 0)).toNumber(), 10000, "should be 10000 for CANDIDATE_1");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  2
      await votingContract.vote(CANDIDATE_2, {
        from: ADDR_2
      });
      //  CANDIDATE_1 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, 0)).toNumber(), 5000, "should be 5000 for CANDIDATE_1");
      //  CANDIDATE_2 = 50%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, 0)).toNumber(), 5000, "should be 5000 for CANDIDATE_2");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  3
      await votingContract.vote(CANDIDATE_3, {
        from: ADDR_3
      });
      //  CANDIDATE_1 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, 0)).toNumber(), 3333, "should be 3333 for CANDIDATE_1");
      //  CANDIDATE_2 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, 0)).toNumber(), 3333, "should be 3333 for CANDIDATE_2");
      //  CANDIDATE_3 = 33.33%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, 0, 0)).toNumber(), 3333, "should be 3333 for CANDIDATE_3");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  4
      await votingContract.addCandidate(CANDIDATE_4, "CANDIDATE_4", 4444);
      await votingContract.vote(CANDIDATE_4, {
        from: ADDR_4
      });
      //  CANDIDATE_1 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, 0)).toNumber(), 2500, "should be 2500 for CANDIDATE_1");
      //  CANDIDATE_2 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, 0)).toNumber(), 2500, "should be 2500 for CANDIDATE_2");
      //  CANDIDATE_3 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, 0, 0)).toNumber(), 2500, "should be 2500 for CANDIDATE_3");
      //  CANDIDATE_4 = 25%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_4, 0, 0)).toNumber(), 2500, "should be 2500 for CANDIDATE_4");
      await increaseTimeTo(latestTime() + duration.minutes(1));

      //  5
      await votingContract.vote(CANDIDATE_1, {
        from: ADDR_5
      });
      //  CANDIDATE_1 = 40%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_1, 0, 0)).toNumber(), 4000, "should be 4000 for CANDIDATE_1");
      //  CANDIDATE_2 = 20%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_2, 0, 0)).toNumber(), 2000, "should be 2000 for CANDIDATE_2");
      //  CANDIDATE_3 = 20%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_3, 0, 0)).toNumber(), 2000, "should be 2000 for CANDIDATE_3");
      //  CANDIDATE_4 = 20%
      assert.equal(new BigNumber(await votingContract.percentageFor.call(CANDIDATE_4, 0, 0)).toNumber(), 2000, "should be 2000 for CANDIDATE_4");
      await increaseTimeTo(latestTime() + duration.minutes(1));
    });
  });
});