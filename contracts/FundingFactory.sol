// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CrowdFunding.sol';

contract ContractFactory {
    address[] public contracts;
    address public platformManager;
    mapping(address => address[]) public ownedContracts;
    mapping(address => address[]) public joinedContracts;
    constructor(){
        platformManager = msg.sender;
    }

    function createFunding(string memory _name, uint256 _target, address manager, uint256 _price, uint256 _period, bool _consent) public returns (address){
        CrowdFunding c = new CrowdFunding(_name, _target, _price, _period, manager, _consent, address(this));
        contracts.push(address(c));
        ownedContracts[msg.sender].push(address(c));
        return address(c);
    }

    function getFundings() public view returns (address[] memory){
        return contracts;
    }

    function getOwnedFundings() public view returns (address[] memory){
        return ownedContracts[msg.sender];
    }

    function getJoinedfundings() public view returns (address[] memory){
        return joinedContracts[msg.sender];
    }

    function joinFunding(address fundingAddress, address participant) public {
        bool found = false;
        for (uint i = 0; i < joinedContracts[participant].length; i++) {
            if (joinedContracts[participant][i] == participant) {
                found = true;
            }
        }
        if (!found) {
            joinedContracts[participant].push(fundingAddress);
        }
    }

}