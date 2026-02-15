// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AIPriorityPunish {
    address public owner;

    uint256 public penaltyRate = 20; // 20% slash
    uint256 public threshold = 5;    // score threshold (0..10)
    uint256 public rewardPool;

    struct Node {
        uint256 stake;
        uint256 score;
        string answer;
        bool exists;
    }

    mapping(address => Node) public nodes;
    address[] public nodeList;

    event Staked(address indexed node, uint256 amount);
    event AnswerSubmitted(address indexed node, string answer);
    event Scored(address indexed node, uint256 score);
    event Rewarded(address indexed node, uint256 amount);
    event Slashed(address indexed node, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner/validator");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function stakeTokens() external payable {
        require(msg.value > 0, "Stake required");
        Node storage n = nodes[msg.sender];

        if (!n.exists) {
            n.exists = true;
            nodeList.push(msg.sender);
        }

        n.stake += msg.value;
        rewardPool += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    function submitAnswer(string calldata answer) external {
        require(nodes[msg.sender].exists, "Stake first");
        nodes[msg.sender].answer = answer;
        emit AnswerSubmitted(msg.sender, answer);
    }

    function submitScore(address node, uint256 score) external onlyOwner {
        require(nodes[node].exists, "Node not found");
        require(score <= 10, "Max score = 10");
        nodes[node].score = score;
        emit Scored(node, score);
    }

    function settle(address node) external onlyOwner {
        Node storage n = nodes[node];
        require(n.exists, "Node not found");

        if (n.score >= threshold) {
            uint256 reward = (rewardPool * n.score) / 10;
            uint256 bal = address(this).balance;
            if (reward > bal) reward = bal;

            if (reward > 0) {
                rewardPool -= reward;
                (bool ok,) = payable(node).call{value: reward}("");
                require(ok, "Reward transfer failed");
                emit Rewarded(node, reward);
            }
        } else {
            uint256 penalty = (n.stake * penaltyRate) / 100;
            if (penalty > 0) {
                n.stake -= penalty;
                rewardPool += penalty;
                emit Slashed(node, penalty);
            }
        }

        n.score = 0;
    }

    function getNodes() external view returns (address[] memory) {
        return nodeList;
    }

    function getNode(address node) external view returns (uint256 stake, uint256 score, string memory answer) {
        Node storage n = nodes[node];
        return (n.stake, n.score, n.answer);
    }

    receive() external payable {
        rewardPool += msg.value;
    }
}
