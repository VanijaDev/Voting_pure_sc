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


contract('whitelist', function (accounts) {
  let votingContract;
  const ADDR_1 = accounts[1];

  beforeEach("setup", async () => {
    await advanceBlock();

    const START_TIME = latestTime() + duration.minutes(1);
    const FINISH_TIME = START_TIME + duration.minutes(1);;
    votingContract = await VotingContract.new([START_TIME, FINISH_TIME]);
  });

  describe("modify whitelist", () => {
    it("should verify owner is able to add to whitelist", async () => {
      await votingContract.addToWhitelist(ADDR_1);
      assert.isTrue(await votingContract.isWhitelisted(ADDR_1), "ADDR_1 should be whitelisted");
    });

    it("should verify owner is able to remove from whitelist", async () => {
      await votingContract.addToWhitelist(ADDR_1);
      await votingContract.removeFromWhitelist(ADDR_1);

      assert.isFalse(await votingContract.isWhitelisted(ADDR_1), "ADDR_1 should not be whitelisted");
    });

    it("should throw if not owner tries to add to whitelist", async () => {
      await expectThrow(votingContract.addToWhitelist(ADDR_1, {
        from: ADDR_1
      }));
    });

    it("should throw if not owner tries to remove from whitelist", async () => {
      await votingContract.addToWhitelist(ADDR_1);
      await expectThrow(votingContract.removeFromWhitelist(ADDR_1, {
        from: ADDR_1
      }));
    });
  });

  describe("vote action", () => {
    it("should validate cannot vote if not whitelisted", async () => {
      let finish = new BigNumber(await votingContract.openTime.call());
      await votingContract.addToWhitelist(ADDR_1);
      await increaseTimeTo(finish.plus(duration.days(2)));
      await expectThrow(votingContract.vote(ADDR_1, {
        from: ADDR_1
      }));
    });
  });
});