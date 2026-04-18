import { ethers } from "ethers";

interface CallAgentParams {
  agentUrl: string;
  endpoint: string;
  payload: Record<string, unknown>;
  maxBudget: string;
  signerPrivateKey: string;
}

export async function callAgentWithPayment(params: CallAgentParams): Promise<Record<string, unknown>> {
  const url = `${params.agentUrl}${params.endpoint}`;

  const probe = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.payload),
  });

  if (probe.status !== 402) {
    return probe.json();
  }

  const data = await probe.json();
  const requirement = data["x-payment-required"];

  if (!requirement) throw new Error("No payment requirement in 402 response");

  const requiredAmount = ethers.formatUnits(requirement.amount, 6);
  if (parseFloat(requiredAmount) > parseFloat(params.maxBudget)) {
    throw new Error(
      `Agent price ${requiredAmount} USDC exceeds budget ${params.maxBudget} USDC`
    );
  }

  const txHash = await submitUSDCPayment(requirement, params.signerPrivateKey);

  const result = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment-Proof": JSON.stringify({ txHash, ...requirement }),
    },
    body: JSON.stringify(params.payload),
  });

  return result.json();
}

async function submitUSDCPayment(
  requirement: { tokenAddress: string; recipient: string; amount: string },
  privateKey: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(
    process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  );
  const wallet = new ethers.Wallet(privateKey, provider);

  const USDC_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
  ];
  const usdc = new ethers.Contract(requirement.tokenAddress, USDC_ABI, wallet);

  const tx = await usdc.transfer(requirement.recipient, requirement.amount);
  await tx.wait();
  return tx.hash;
}
