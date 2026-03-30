# Decentralized AI Task Validation Using a Stake-Based Prioritize–Punish Mechanism

## Overview

This project is a blockchain-based prototype that demonstrates how **economic incentives** can be used to validate AI-generated outputs in a decentralized environment.

Instead of relying on centralized moderation, participants must **stake ETH** before submitting answers. Based on performance, they are either rewarded or penalized using a smart contract.

The system models a complete:

**Stake → Evaluate → Reward/Slash** lifecycle.

---

## Core Idea

The mechanism works as follows:

1. A participant stakes ETH into the contract.
2. The participant submits an answer.
3. A validator assigns a score (0–10).
4. Based on the score:
   - If score ≥ threshold → participant receives reward.
   - If score < threshold → participant’s stake is partially slashed.

This creates:

- Economic commitment  
- Incentive alignment  
- Spam resistance  
- Self-regulation  

---

## Tech Stack

### Smart Contract Layer
- **Solidity (v0.8.20)**
- Implements staking, answer submission, scoring, and settlement logic.

### Blockchain Development Environment
- **Hardhat**
- Used to:
  - Compile contracts
  - Run a local Ethereum blockchain
  - Deploy the smart contract

### Frontend
- **Next.js**
- **TypeScript**
- **Ethers.js** (for blockchain interaction)

### Wallet
- **MetaMask** (connected to local Hardhat network)

---

## Smart Contract Design

### Node Structure

Each participant is stored as:

```solidity
struct Node {
    uint256 stake;
    uint256 score;
    string answer;
    bool exists;
}
```

We use:

```solidity
mapping(address => Node) public nodes;
```

This maps wallet addresses to their on-chain state.

We also maintain:

```solidity
address[] public nodeList;
```

Because mappings are not iterable.

---

## Key Functions

### 1. stakeTokens()

```solidity
function stakeTokens() external payable
```

- Accepts ETH via `msg.value`
- Records stake
- Adds participant to list
- Increases reward pool

Purpose: Enforces economic commitment before participation.

---

### 2. submitAnswer(string answer)

- Stores the participant’s answer on-chain.
- Requires the user to stake first.

---

### 3. submitScore(address node, uint256 score)

- Only callable by contract owner (validator).
- Score must be between 0 and 10.

---

### 4. settle(address node)

Core logic of the mechanism.

If score ≥ threshold (5):

- Reward is calculated:

```solidity
reward = (rewardPool * score) / 10;
```

- ETH is transferred using:

```solidity
call{value: reward}
```

If score < threshold:

- 20% of stake is slashed.
- Slashed amount is added back to reward pool.

After settlement:
- Score resets to 0.

---

## Economic Model

The system is designed to:

- Reward high-quality submissions  
- Penalize low-effort or malicious submissions  
- Encourage honest participation  
- Discourage spam  

The mechanism is inspired by:

- Proof-of-Stake systems  
- Slashing mechanisms  
- Incentive-based governance models  

---

## How to Run the Prototype

### 1. Start Local Blockchain

```bash
cd contract
npx hardhat node
```

### 2. Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start Frontend

```bash
cd ../app
npm run dev
```

### 4. Open Website

Visit:

```
http://localhost:3000
```

### 5. Connect MetaMask

- Switch to **Localhost 8545**
- Import a Hardhat test account
- Stake ETH and submit answers

---

## Limitations

This is a prototype and includes simplifications:

- Single centralized validator
- Full answers stored on-chain (gas heavy)
- Simplified reward formula
- No DAO governance
- No advanced reputation mechanism

---

## Future Improvements

- Multi-validator consensus scoring
- IPFS-based answer storage
- Reputation-based weighting
- Automated AI scoring integration
- Improved reward distribution model

---

## Conclusion

This project demonstrates how blockchain-based economic mechanisms can be applied to AI task validation.

It combines:

- Smart contract logic  
- Incentive engineering  
- Decentralized participation  
- On-chain transparency  

The prototype serves as a foundational model for decentralized AI validation systems.
