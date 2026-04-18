import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  console.log(`Deploying from: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} AVAX`);

  const artifactPath = path.join(__dirname, "AgentRegistry.json");

  let bytecode: string;
  let abi: Record<string, unknown>[];

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    bytecode = artifact.bytecode;
    abi = artifact.abi;
  } else {
    abi = JSON.parse(fs.readFileSync(path.join(__dirname, "abis", "AgentRegistry.json"), "utf8")) as Record<string, unknown>[];
    bytecode = AgentRegistryBytecode;
  }

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\nAgentRegistry deployed to: ${address}`);
  console.log(`\nAdd to .env.local:`);
  console.log(`AGENT_REGISTRY_CONTRACT=${address}`);

  const abiPath = path.join(__dirname, "abis", "AgentRegistry.json");
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`\nABI saved to contracts/abis/AgentRegistry.json`);
}

const AgentRegistryBytecode =
  "0x608060405234801561001057600080fd5b5061000161001f565b610097565b600054610100900460ff16156100785760405162461bcd60e51b815260206004820152602760248201527f492065787065637420746865207061796d656e7420746f20626520666f7220604482015266081d985b1a596d60ca1b606482015260840160405180910390fd5b61008f600080546001600160a01b03191633179055565b610149565b610149565b600080fd5b634e487b7160e01b600052604160045260246000fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f8401126100dc57600080fd5b50813567ffffffffffffffff8111156100f457600080fd5b6020830191508360208260051b850101111561010f57600080fd5b9250925050509150915600";

main().catch(console.error);
