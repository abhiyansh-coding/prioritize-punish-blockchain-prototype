# Prioritize–Punish Prototype

A decentralized staking + scoring + reward/slash demo.

## Flow

1. Miner stakes ETH (local Hardhat chain)
2. Miner submits answer
3. Admin assigns score (0–10)
4. Admin settles:
   - High score → reward
   - Low score → slash stake

## Tech Stack
- Solidity (Hardhat)
- Next.js frontend
- MetaMask
- Local blockchain (chainId 31337)

## Run Locally

Terminal 1:
cd contract
npx hardhat node

Terminal 2:
cd contract
npx hardhat run scripts/deploy.js --network localhost

Terminal 3:
cd app
npm install
npm run dev

Open http://localhost:3000
