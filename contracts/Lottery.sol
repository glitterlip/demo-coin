// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//1szabo
contract Lottery {
    uint256 public minimum;
    uint256 public target;
    uint256 public current;
    address  public manager;
    address[] public players;
    Bettor[] public bettors;
    Winner[] public winners;
    uint256 public round;

    struct Bettor {
        address addr;
        uint256 value;
    }

    struct Winner {
        uint256 round;
        address addr;
    }

    constructor(uint256 _target) {
        manager = msg.sender;
        minimum = 10 ** 15;
        target = _target * minimum;
    }
    function bet() public payable {
        require(msg.value % (minimum) == 0, "Your bet must be an integer multiple of 1 Finney");
        require(msg.value > 0, string(bytes.concat("Your bet must great then 1 Finney  Finney")));
        uint256 value = msg.value;
        if (msg.value + current > target) {
            payable(msg.sender).transfer(msg.value + current - target);
            value = target - current;
        }
        uint num = value / (minimum);
        for (uint i = 0; i < num; i++) {
            players.push(msg.sender);
        }
        bettors.push(Bettor({addr : msg.sender, value : msg.value}));
        current += msg.value;
        if (current >= target) {
            draw();
        }
    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
    }

    function getPlayers() public view returns (address[] memory){
        return players;
    }

    function getBettors() public view returns (Bettor[] memory){
        return bettors;
    }

    function getWinners() public view returns (Winner[] memory){
        return winners;
    }

    function rand(uint256 _length) public view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players.length)));
        return random % _length;
    }

    function draw() public payable {
        address winner = players[rand(players.length)];
        uint256 prize = address(this).balance * 99 / 100;
        payable(winner).transfer(prize);
        payable(manager).transfer(address(this).balance);
        delete players;
        delete bettors;
        winners.push(Winner(round, winner));
        if (winners.length > 50) {
            delete winners;
        }
        current = 0;
        round++;
    }
}
