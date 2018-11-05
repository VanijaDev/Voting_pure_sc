const VotingContract = artifacts.require("./VotingContract.sol");
const Asserts = require("./helpers/asserts");
const Reverter = require("./helpers/reverter");


contract('whitelist', function (accounts) {
  let votingContract;
  const asserts = Asserts(assert);

  before("setup", async () => {
    votingContract = await VotingContract.deployed();
    await Reverter.snapshot();
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  describe("modify whitelist", () => {
    it("should verify owner is able to add to whitelist", async () => {
      const ADDR_1 = accounts[1];

      await votingContract.addToWhitelist(ADDR_1);
      assert.isTrue(await votingContract.isWhitelisted(ADDR_1), "ADDR_1 should be whitelisted");
    });

    it("should verify owner is able to remove from whitelist", async () => {
      const ADDR_1 = accounts[1];

      await votingContract.addToWhitelist(ADDR_1);
      await votingContract.removeFromWhitelist(ADDR_1);

      assert.isFalse(await votingContract.isWhitelisted(ADDR_1), "ADDR_1 should not be whitelisted");
    });

    it("should throw if not owner tries to add to whitelist", async () => {
      const ADDR_1 = accounts[1];

      await asserts.throws(votingContract.addToWhitelist(ADDR_1, {
        from: ADDR_1
      }));
    });

    it("should throw if not owner tries to remove from whitelist", async () => {
      const ADDR_1 = accounts[1];

      await votingContract.addToWhitelist(ADDR_1);
      await asserts.throws(votingContract.removeFromWhitelist(ADDR_1, {
        from: ADDR_1
      }));
    });
  });
});