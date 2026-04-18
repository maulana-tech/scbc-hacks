import { ethers } from "ethers";
import AgentRegistryABI from "../contracts/abis/AgentRegistry.json";

const AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const AGENT_REGISTRY_ADDRESS = process.env.AGENT_REGISTRY_CONTRACT || "";

function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(AVALANCHE_RPC_URL);
}

function getSigner(privateKey?: string): ethers.Wallet {
  const provider = getProvider();
  const key = privateKey || process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) throw new Error("No private key provided");
  return new ethers.Wallet(key, provider);
}

export function getContract(signerOrProvider?: ethers.Wallet | ethers.JsonRpcProvider) {
  if (!AGENT_REGISTRY_ADDRESS) throw new Error("AGENT_REGISTRY_CONTRACT not set");
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(AGENT_REGISTRY_ADDRESS, AgentRegistryABI, provider);
}

export function getReadOnlyContract() {
  return getContract(getProvider());
}

export function getSignedContract(privateKey?: string) {
  return getContract(getSigner(privateKey));
}

export { getProvider, getSigner };
