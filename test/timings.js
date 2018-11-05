const VotingContract = artifacts.require("./VotingContract.sol");
const Asserts = require("./helpers/asserts");
const Reverter = require("./helpers/reverter");


contract('timings', function (accounts) {
  let votingContract;
  const OWNER = accounts[0];
  const asserts = Asserts(assert);

  before("setup", async () => {
    votingContract = await VotingContract.deployed();
    await Reverter.snapshot();
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  describe("initial values", () => {
    it("should throw if start time is in past", async () => {
      await asserts.throws(VotingContract.new([web3.eth.getBlock("latest").timestamp - 1, web3.eth.getBlock("latest").timestamp + 100]));
    });

    it("should throw if start time is after finish time", async () => {
      await asserts.throws(VotingContract.new([web3.eth.getBlock("latest").timestamp + 100, web3.eth.getBlock("latest").timestamp + 10]));
    });
  });
});