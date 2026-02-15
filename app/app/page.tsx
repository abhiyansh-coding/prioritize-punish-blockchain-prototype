"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "../lib/contract-abi.json";
import addr from "../lib/contract-address.json";

export default function Home() {
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<any>(null);

  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [answer, setAnswer] = useState("");
  const [scoreAddr, setScoreAddr] = useState("");
  const [score, setScore] = useState("5");

  useEffect(() => {
    if ((window as any).ethereum) {
      const prov = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );
      setProvider(prov);
    }
  }, []);

  const connect = async () => {
    await provider.send("eth_requestAccounts", []);
    const signerObj = provider.getSigner();
    const address = await signerObj.getAddress();
    const contractObj = new ethers.Contract(
      (addr as any).address,
      abi,
      signerObj
    );

    setSigner(signerObj);
    setAccount(address);
    setContract(contractObj);
  };

  const stake = async () => {
    const tx = await contract.stakeTokens({
      value: ethers.utils.parseEther(stakeAmount),
    });
    await tx.wait();
    alert("Staked!");
  };

  const submitAnswer = async () => {
    const tx = await contract.submitAnswer(answer);
    await tx.wait();
    alert("Answer submitted!");
  };

  const submitScore = async () => {
    const tx = await contract.submitScore(scoreAddr, score);
    await tx.wait();
    alert("Score submitted!");
  };

  const settle = async () => {
    const tx = await contract.settle(scoreAddr);
    await tx.wait();
    alert("Settled!");
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>AI Prioritize-Punish Prototype</h1>

      <button onClick={connect}>Connect MetaMask</button>
      <p>Connected: {account}</p>

      <hr />

      <h3>Stake</h3>
      <input
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
      />
      <button onClick={stake}>Stake</button>

      <h3>Submit Answer</h3>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button onClick={submitAnswer}>Submit</button>

      <hr />

      <h3>Admin Actions</h3>
      <input
        placeholder="Node Address"
        value={scoreAddr}
        onChange={(e) => setScoreAddr(e.target.value)}
      />
      <input
        placeholder="Score (0-10)"
        value={score}
        onChange={(e) => setScore(e.target.value)}
      />
      <button onClick={submitScore}>Submit Score</button>
      <button onClick={settle}>Settle</button>
    </div>
  );
}
