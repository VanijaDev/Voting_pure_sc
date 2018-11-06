// const VotingContract = artifacts.require("./VotingContract.sol");
// import expectThrow from './helpers/expectThrow';
// import {
//   advanceBlock
// } from './helpers/advanceToBlock';
// import increaseTime, {
//   duration,
//   increaseTimeTo
// } from './helpers/increaseTime';
// import latestTime from './helpers/latestTime';


// contract('voting', function (accounts) {

//   beforeEach("setup", async () => {
//     await advanceBlock();

//     const START_TIME = latestTime() + duration.minutes(1);
//     const FINISH_TIME = START_TIME + duration.minutes(1);;
//     votingContract = await VotingContract.new([START_TIME, FINISH_TIME]);
//   });

//   describe("initial values", () => {
//     it("should throw if start time is in past", async () => {
//       await expectThrow(VotingContract.new([web3.eth.getBlock("latest").timestamp - 1, web3.eth.getBlock("latest").timestamp + 100]));
//     });

//     it("should throw if start time is after finish time", async () => {
//       await expectThrow(VotingContract.new([web3.eth.getBlock("latest").timestamp + 100, web3.eth.getBlock("latest").timestamp + 10]));
//     });
//   });
// });