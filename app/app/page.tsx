"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import abi from "../lib/contract-abi.json";
import addr from "../lib/contract-address.json";

type LogItem = { t: string; msg: string };

export default function Home() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [answer, setAnswer] = useState("");
  const [nodeAddr, setNodeAddr] = useState("");
  const [score, setScore] = useState("8");

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [nodes, setNodes] = useState<string[]>([]);
  const [fStake, setFStake] = useState<string>("");
  const [fScore, setFScore] = useState<string>("");
  const [fAnswer, setFAnswer] = useState<string>("");

  const contractAddress = (addr as any).address as string;

  const addLog = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLogs((prev) => [{ t, msg }, ...prev].slice(0, 12));
  };

  useEffect(() => {
    const anyWin = window as any;
    const eth = anyWin.ethereum;

    if (!eth) return;

    // If multiple wallets exist, prefer MetaMask
    const mm =
      eth?.providers?.find((p: any) => p.isMetaMask) ||
      (eth?.isMetaMask ? eth : null);

    if (!mm) return;

    const prov = new ethers.providers.Web3Provider(mm);
    setProvider(prov);

    // Auto refresh on account / chain change (saves you from “it didn’t switch”)
    mm.on?.("accountsChanged", () => window.location.reload());
    mm.on?.("chainChanged", () => window.location.reload());
  }, []);

  const isConnected = !!account && !!contract;

  const connect = async () => {
    if (!provider) {
      alert("MetaMask not detected. Please install/enable MetaMask.");
      return;
    }
    await provider.send("eth_requestAccounts", []);
    const signerObj = provider.getSigner();
    const address = await signerObj.getAddress();

    const contractObj = new ethers.Contract(contractAddress, abi as any, signerObj);

    setSigner(signerObj);
    setAccount(address);
    setContract(contractObj);

    addLog(`Connected: ${address}`);
  };

  const requireConnected = () => {
    if (!contract) {
      alert("Connect MetaMask first.");
      return false;
    }
    return true;
  };

  const requireValidAddress = (a: string) => {
    if (!a || !ethers.utils.isAddress(a)) {
      alert("Paste a valid node address (0x...).");
      return false;
    }
    return true;
  };

  const stake = async () => {
    if (!requireConnected()) return;
    addLog(`Staking ${stakeAmount} ETH...`);
    const tx = await contract!.stakeTokens({
      value: ethers.utils.parseEther(stakeAmount),
    });
    await tx.wait();
    addLog("Stake confirmed ✅");
  };

  const submitAnswer = async () => {
    if (!requireConnected()) return;
    if (!answer.trim()) {
      alert("Write an answer first.");
      return;
    }
    addLog("Submitting answer...");
    const tx = await contract!.submitAnswer(answer.trim());
    await tx.wait();
    addLog("Answer submitted ✅");
    setAnswer("");
  };

  const submitScore = async () => {
    if (!requireConnected()) return;
    if (!requireValidAddress(nodeAddr)) return;

    const s = Number(score);
    if (Number.isNaN(s) || s < 0 || s > 10) {
      alert("Score must be between 0 and 10.");
      return;
    }

    addLog(`Submitting score ${s} for ${nodeAddr}...`);
    const tx = await contract!.submitScore(nodeAddr, s);
    await tx.wait();
    addLog("Score submitted ✅");
  };

  const settle = async () => {
    if (!requireConnected()) return;
    if (!requireValidAddress(nodeAddr)) return;

    addLog(`Settling ${nodeAddr} (reward/slash)...`);
    const tx = await contract!.settle(nodeAddr);
    await tx.wait();
    addLog("Settled ✅");
  };

  const loadNodes = async () => {
    if (!requireConnected()) return;
    addLog("Loading participant list...");
    const list: string[] = await contract!.getNodes();
    setNodes(list);
    addLog(`Loaded ${list.length} participant(s) ✅`);
  };

  const fetchNode = async (a?: string) => {
    if (!requireConnected()) return;
    const target = (a ?? nodeAddr).trim();
    if (!requireValidAddress(target)) return;

    addLog(`Fetching node data for ${target}...`);
    const [stakeWei, scoreVal, ansVal] = await contract!.getNode(target);

    setFStake(ethers.utils.formatEther(stakeWei));
    setFScore(String(scoreVal));
    setFAnswer(String(ansVal));

    addLog("Node data loaded ✅");
  };

  const shortAddr = useMemo(() => {
    if (!account) return "";
    return `${account.slice(0, 6)}...${account.slice(-4)}`;
  }, [account]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
        Decentralized AI Task Validation (Stake-Based Prioritize–Punish)
      </h1>
      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Prototype demo: stake → submit answer → admin scores → settle (reward/slash).
      </p>

      <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={connect}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isConnected ? "Reconnect Wallet" : "Connect MetaMask"}
          </button>

          <div style={{ fontSize: 14 }}>
            <div><b>Connected:</b> {account ? shortAddr : "Not connected"}</div>
            <div><b>Contract:</b> {contractAddress}</div>
            <div style={{ opacity: 0.8 }}>
              Tip: switch MetaMask account → page auto-refreshes.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Task Prompt</h2>
        <div style={{ background: "#000000", borderRadius: 10, padding: 12 }}>
          <b>Prompt:</b> Explain in 2–3 lines why staking helps prevent spam/Sybil attacks in decentralized systems.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <b>Miner Flow</b>
            <ol style={{ margin: "8px 0 0 18px" }}>
              <li>Connect wallet</li>
              <li>Stake</li>
              <li>Submit answer</li>
            </ol>
          </div>
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <b>Admin Flow</b>
            <ol style={{ margin: "8px 0 0 18px" }}>
              <li>Switch to Admin account</li>
              <li>Paste miner address</li>
              <li>Submit score (0–10)</li>
              <li>Settle (reward/slash)</li>
            </ol>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Miner Actions</h2>

          <label style={{ display: "block", fontSize: 13, opacity: 0.85 }}>Stake amount (ETH)</label>
          <input
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />
          <button
            onClick={stake}
            style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            Stake
          </button>

          <div style={{ height: 12 }} />

          <label style={{ display: "block", fontSize: 13, opacity: 0.85 }}>Answer</label>
          <textarea
            placeholder="Write your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{
              width: "100%",
              height: 110,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #ddd",
              marginTop: 6,
              resize: "vertical",
            }}
          />
          <button
            onClick={submitAnswer}
            style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            Submit Answer
          </button>
        </div>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Admin Actions</h2>

          <label style={{ display: "block", fontSize: 13, opacity: 0.85 }}>Miner / Node Address</label>
          <input
            placeholder="0x..."
            value={nodeAddr}
            onChange={(e) => setNodeAddr(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={loadNodes}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Load Participants
            </button>
            <button
              onClick={() => fetchNode()}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Fetch Answer/Status
            </button>
          </div>

          {nodes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
                Click an address to auto-fill:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 140, overflow: "auto" }}>
                {nodes.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setNodeAddr(n);
                      fetchNode(n);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #eee",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(fStake || fAnswer || fScore) && (
            <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13 }}><b>Stake:</b> {fStake || "-"} ETH</div>
              <div style={{ fontSize: 13 }}><b>Current Score:</b> {fScore || "-"}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                <b>Answer:</b>
                <div style={{ background: "#000000", border: "1px solid #eaeaea", borderRadius: 10, padding: 10, marginTop: 6 }}>
                  {fAnswer ? fAnswer : "(No answer found)"}
                </div>
              </div>
            </div>
          )}

          <label style={{ display: "block", fontSize: 13, opacity: 0.85, marginTop: 10 }}>Score (0–10)</label>
          <input
            value={score}
            onChange={(e) => setScore(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd", marginTop: 6 }}
          />

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={submitScore}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Submit Score
            </button>
            <button
              onClick={settle}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
            >
              Settle
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
            <b>Rule:</b> Score ≥ threshold → reward. Score &lt; threshold → slash stake (penalty).
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Activity</h2>
        {logs.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No actions yet. Connect wallet to begin.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {logs.map((l, i) => (
              <li key={i}>
                <b>{l.t}:</b> {l.msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 18, fontSize: 13, opacity: 0.75 }}>
        Note: This prototype is designed to run on a local Hardhat blockchain (chainId 31337). No real ETH required.
      </div>
    </div>
  );
}
