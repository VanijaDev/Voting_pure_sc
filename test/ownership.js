const VotingContract = artifacts.require("./VotingContract.sol");
const Asserts = require("./helpers/asserts");
const Reverter = require("./helpers/reverter");


contract('ownership', function (accounts) {
  let votingContract;
  const asserts = Asserts(assert);

  before("setup", async () => {
    votingContract = await VotingContract.deployed();
    await Reverter.snapshot();
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  describe.only("add candidate", () => {
    it("should verify owner is able to add candidate", async () => {
      const ADDR_1 = accounts[1];

      await votingContract.addCandidate(ADDR_1, "ADDR_1", 111);
    });

    it("should verify not owner is not able to add candidate", async () => {
      const ADDR_1 = accounts[1];

      await asserts.throws(votingContract.addCandidate(ADDR_1, "ADDR_1", 111, {
        from: ADDR_1
      }));
    });

    it("should verify owner is able to call voterVoterFor()", async () => {
      const ADDR_1 = accounts[1];

      await votingContract.voterVoterFor.call(ADDR_1);
    });

    it("should verify not owner is not able to call voterVoterFor()", async () => {
      const ADDR_1 = accounts[1];

      await asserts.throws(votingContract.voterVoterFor(ADDR_1, {
        from: ADDR_1
      }));
    });

  });
});