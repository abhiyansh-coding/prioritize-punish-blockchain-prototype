const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const C = await ethers.getContractFactory("AIPriorityPunish");
  const c = await C.deploy();
  await c.deployed();

  console.log("Contract deployed to:", c.address);

  // Export ABI + address for frontend later
  const appSrc = path.join(__dirname, "..", "..", "app", "lib");
  fs.mkdirSync(appSrc, { recursive: true });

  const artifact = await artifacts.readArtifact("AIPriorityPunish");
  fs.writeFileSync(path.join(appSrc, "contract-abi.json"), JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(path.join(appSrc, "contract-address.json"), JSON.stringify({ address: c.address }, null, 2));

  console.log("Wrote ABI + address to app/src/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
