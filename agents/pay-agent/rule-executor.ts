import { prisma } from "../../lib/db";
import { enforceSpendingLimits } from "../../lib/spend-enforcer";

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

  // In production, this would call submitPayment from scheduler.ts
  // For now, simulate a successful payment
  const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;

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
}
