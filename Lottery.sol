//SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.5.0 < 0.9.0;

contract Lottery {
    address public manager;
    address payable[] public participants;
    bool public lotteryActive;

    // Anyone can start a new lottery round - they become the manager
    function startLottery() public {
        require(!lotteryActive, "Lottery is already active");
        require(manager == address(0), "Lottery already has a manager");
        manager = msg.sender;
        lotteryActive = true;
    }

    receive() external payable {
        require(lotteryActive, "Lottery is not active");
        require(msg.value == 2000000000000000 wei, "Must send exactly 0.002 ether");
        participants.push(payable(msg.sender));
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function random() public view returns(uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participants.length)));
    }

    function selectWinner() public {
        require(msg.sender == manager, "Only manager can select winner");
        require(participants.length >= 3, "Need at least 3 participants");
        require(lotteryActive, "Lottery is not active");

        uint r = random();
        address payable winner;
        uint index = r % participants.length;
        winner = participants[index];
        winner.transfer(address(this).balance);

        participants = new address payable[](0);
        lotteryActive = false;
        manager = address(0);
    }
}
