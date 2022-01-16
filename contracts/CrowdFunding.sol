// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './FundingFactory.sol';

contract CrowdFunding {

    address public  manager;
    address public parent;
    string public name;
    uint256 public target;
    uint256 public price;
    uint256 public endAt;//seconds
    uint256 public current;
    Investor[] investors;
    uint256 public investorsCount;
    mapping(uint => Expense) expenses;
    mapping(address => uint256) investorsMap;

    uint256 expensesCount;
    bool needConsent;
    bool ended;

    constructor(string memory _name, uint256 _target, uint256 _price, uint256 _period, address _manager, bool _consent, address _parent){
        manager = _manager;
        name = _name;
        target = _target * 10 ** 15;
        price = _price * 10 ** 15;
        endAt = block.timestamp + _period * 86400;
        needConsent = _consent;
        parent = _parent;

    }

    struct Expense {
        string reason;
        uint256 amount;
        address receiver;
        ExpenseStatus status;
        uint256 approveCount;
        mapping(address => VoteStatus) voters;
    }
    enum ExpenseStatus{
        Pending, Approved, Rejected
    }
    enum VoteStatus{
        Pending, Approved, Rejected
    }
    struct Investor {
        address addr;
        uint256 amount;
    }

    function invest() payable public {
        require(ended == false, "already ended");
        if (needConsent) {
            string memory err = "you can only pay ";
            string memory priceStr = uintToStr(price);
            string memory errMsg = strConcat(err, priceStr);
            require(msg.value >= price, errMsg);

        }
        investors.push(Investor({addr : msg.sender, amount : msg.value}));
        if (investorsMap[msg.sender] == 0) {
            investorsCount++;
            ContractFactory cf = ContractFactory(parent);
            cf.joinFunding(address(this), msg.sender);
        }
        investorsMap[msg.sender] += msg.value;
        current += msg.value;

    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
    }

    function getInvstors() public view returns (Investor[] memory){
        return investors;
    }

    modifier onlyManager {
        require(msg.sender == manager || msg.sender == parent, 'only funding manager or platform manager');
        _;
    }
    function failRefund() public onlyManager {
        for (uint256 i = 0; i < investors.length; i++) {
            payable(investors[i].addr).transfer(price);
        }

        delete (investors);
    }

    function vote(uint256 index, VoteStatus r) public {
        Expense storage expense = expenses[index];
        require(investorsMap[msg.sender] > 0, "you are not a project investor");
        require(expense.voters[msg.sender] == VoteStatus.Pending, "you have already voted");
        expense.voters[msg.sender] = r;
        if (r == VoteStatus.Approved) {
            expense.approveCount++;
        }

    }

    function applyExpense(string memory _reason, uint _amount, address _receiver) public onlyManager {
        if (!needConsent) {
            require(address(this).balance > _amount);
            payable(_receiver).transfer(_amount);
            return;
        }

        uint expenseId = expensesCount++;
        Expense storage expense = expenses[expenseId];
        expense.reason = _reason;
        expense.amount = _amount * 10 ** 15;
        expense.receiver = _receiver;
        expense.status = ExpenseStatus.Pending;
        expense.approveCount = 0;
    }

    function execExpense(uint256 index) public payable onlyManager {
        Expense storage expense = expenses[index];
        require(expense.status == ExpenseStatus.Pending, "already processed");
        require(expense.approveCount * 2 > investorsCount, "not enough approvals");
        require(address(this).balance >= expense.amount, "not enough money");
        expense.status = ExpenseStatus.Approved;
        payable(expense.receiver).transfer(expense.amount);
    }

    function terminate() public onlyManager {
        ended = true;
    }

    function getInvestorsCount() public view returns (uint256){
        return investors.length;
    }

    function getExpenseCount() public view returns (uint256){
        return expensesCount;
    }

    function getExpnseByIndex(uint256 _index) public view returns (string memory, uint256, address, ExpenseStatus, uint256){
        Expense storage e = expenses[_index];
        string memory reason = e.reason;
        return (reason, e.amount, e.receiver, e.status, e.approveCount);
    }

    function getInfo() public view returns (address, string memory, uint256, uint256, uint256, uint256, Investor[] memory, uint256, uint256, bool, bool, address){
        return (manager, name, target, current, price, endAt, investors, investorsCount, expensesCount, needConsent, ended, address(this));

    }

    function strConcat(string memory a, string memory b) public pure returns (string memory){
        return string(abi.encodePacked(a, b));
    }


    function uintToStr(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

