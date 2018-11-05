let VotingContract = artifacts.require("./VotingContract.sol");

module.exports = function (deployer) {
    const START_TIME = web3.eth.getBlock("latest").timestamp + 1;
    const FINISH_TIME = START_TIME + 100;

    deployer.deploy(VotingContract, [START_TIME, FINISH_TIME]).then((res, err) => {
        console.log("\n\nDeployed with address: " + res.address);
    });
}