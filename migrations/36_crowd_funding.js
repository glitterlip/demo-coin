const Migrations = artifacts.require("ContractFactory");

module.exports = function (deployer) {
  deployer.deploy(Migrations,);
};
