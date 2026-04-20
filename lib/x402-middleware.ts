export interface X402Options {
  agentAddress: string;
  price: string;
  description: string;
}

export interface PaymentRequirement {
  version: string;
  network: string;
  chainId: number;
  token: string;
  tokenAddress: string;
  amount: string;
  decimals: number;
  recipient: string;
  description: string;
  expiresAt: number;
  paymentProcessor?: string;
  requestId?: string;
}

function parseUnitsSimple(value: string, decimals: number): string {
  const [intPart, fracPart = ""] = value.split(".");
  const padded = fracPart.padEnd(decimals, "0").slice(0, decimals);
  return (intPart + padded).replace(/^0+/, "") || "0";
}

function simpleRequestId(agent: string, token: string, amount: string, expires: number): string {
  const raw = `${agent}:${token}:${amount}:${expires}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return "0x" + hex.repeat(8);
}

function env(key: string, fallback?: string): string | undefined {
  const v = process.env[key];
  if (!v) return fallback;
  return v.trim() || fallback;
}

export function buildPaymentRequired(options: X402Options): PaymentRequirement {
  const chainId = Number(env("AVALANCHE_CHAIN_ID") || 43113);
  const network =
    env("X402_NETWORK") || (chainId === 43113 ? "avalanche-fuji" : "local");

  const expiresAt = Math.floor(Date.now() / 1000) + 600;
  const tokenAddress =
    env("USDC_CONTRACT_ADDRESS") || "0x5425890C6C9Fc8561a8b4E763b7E6e43b7e9A5F4";
  const amount = parseUnitsSimple(options.price, 6);
  const requestId = simpleRequestId(options.agentAddress, tokenAddress, amount, expiresAt);
  const paymentProcessor = env("PAYMENT_PROCESSOR_CONTRACT");

  return {
    version: "1.0",
    network,
    chainId,
    token: "USDC",
    tokenAddress,
    amount,
    decimals: 6,
    recipient: options.agentAddress,
    description: options.description,
    expiresAt,
    ...(paymentProcessor ? { paymentProcessor } : {}),
    requestId,
  };
}

export async function verifyPaymentOnChain(
  proof: { txHash: string; recipient: string; amount: string; tokenAddress: string },
  options: X402Options
): Promise<boolean> {
  if (process.env.X402_SKIP_VERIFY === "true") {
    return true;
  }

  try {
    const { ethers } = await import("ethers");

    const provider = new ethers.JsonRpcProvider(
      process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
    );

    const tx = await provider.getTransaction(proof.txHash);
    if (!tx) return false;

    const receipt = await provider.getTransactionReceipt(proof.txHash);
    if (!receipt || receipt.status !== 1) return false;

    const expectedAmount = ethers.parseUnits(options.price, 6);
    const expectedRecipient = options.agentAddress.toLowerCase();

    if (tx.to?.toLowerCase() !== expectedRecipient) {
      const USDC_ABI = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ];
      const usdcContract = new ethers.Contract(
        proof.tokenAddress || process.env.USDC_CONTRACT_ADDRESS!,
        USDC_ABI,
        provider
      );

      const transferEvent = receipt.logs
        .map((log) => {
          try {
            return usdcContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(
          (e) =>
            e &&
            e.name === "Transfer" &&
            e.args?.to?.toLowerCase() === expectedRecipient &&
            e.args?.value !== undefined
        );

      if (!transferEvent) return false;
      if (transferEvent.args.value < expectedAmount) return false;
    }

    return true;
  } catch (error) {
    console.error("Payment verification failed:", error);
    if (process.env.X402_FALLBACK_ACCEPT === "true") {
      return true;
    }
    return false;
  }
}

export async function recordSuccessfulTx(agentAddress: string, amount: string) {
  try {
    const { getSignedContract } = await import("./contracts");
    const { ethers } = await import("ethers");
    const contract = getSignedContract();
    const tx = await contract.recordSuccessfulTx(
      agentAddress,
      ethers.parseUnits(amount, 6)
    );
    await tx.wait();
    console.log(`Reputation updated for ${agentAddress}`);
  } catch (error) {
    console.error("Failed to update reputation:", error);
  }
}
