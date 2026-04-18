import { prisma } from "../../lib/db";
import { enforceSpendingLimits } from "../../lib/spend-enforcer";
import { ethers } from "ethers";

async function submitPayment(toAddress: string, amount: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(
    process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  );
  const wallet = new ethers.Wallet(process.env.PAY_AGENT_PRIVATE_KEY!, provider);

  const USDC_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];
  const usdc = new ethers.Contract(
    process.env.USDC_CONTRACT_ADDRESS!,
    USDC_ABI,
    wallet
  );

  const tx = await usdc.transfer(toAddress, ethers.parseUnits(amount, 6));
  await tx.wait();
  return tx.hash;
}

export async function executePayment(
  configId: string,
  ruleId: string,
  recipientAddress: string,
  amount: string,
  type: string
): Promise<{ success: boolean; txHash?: string; reason?: string }> {
  const result = await enforceSpendingLimits(configId, amount, recipientAddress, ruleId);
  if (!result.allowed) {
    return { success: false, reason: result.reason };
  }

  try {
    const txHash = await submitPayment(recipientAddress, amount);

    await prisma.transaction.create({
      data: {
        configId,
        ruleId,
        type,
        recipientAddress,
        amount,
        txHash,
        status: "completed",
      },
    });

    const rule = await prisma.spendRule.findUnique({ where: { id: ruleId } });
    if (rule) {
      await prisma.spendRule.update({
        where: { id: ruleId },
        data: {
          totalSpentToDate: (parseFloat(rule.totalSpentToDate) + parseFloat(amount)).toFixed(2),
        },
      });
    }

    return { success: true, txHash };
  } catch (error) {
    await prisma.transaction.create({
      data: {
        configId,
        ruleId,
        type,
        recipientAddress,
        amount,
        status: "failed",
        metadata: JSON.stringify({ error: String(error) }),
      },
    });
    return { success: false, reason: `Payment failed: ${String(error)}` };
  }
}
