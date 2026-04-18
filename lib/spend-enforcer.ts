import { prisma } from "./db";

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
}

export async function enforceSpendingLimits(
  configId: string,
  amount: string,
  recipientAddress: string,
  ruleId?: string
): Promise<EnforcementResult> {
  const config = await prisma.payAgentConfig.findUnique({
    where: { id: configId },
    include: { rules: true },
  });

  if (!config) return { allowed: false, reason: "Config not found" };

  if (config.isPaused) return { allowed: false, reason: "Payments paused" };

  if (ruleId) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return { allowed: false, reason: "Rule not found" };
    if (!rule.enabled) return { allowed: false, reason: "Rule disabled" };
  }

  const paymentAmount = parseFloat(amount);

  if (paymentAmount > parseFloat(config.maxSinglePayment)) {
    return { allowed: false, reason: `Amount ${amount} exceeds max single payment ${config.maxSinglePayment}` };
  }

  const blockedLower = config.blockedRecipients.map((a) => a.toLowerCase());
  if (blockedLower.includes(recipientAddress.toLowerCase())) {
    return { allowed: false, reason: "Recipient is blocked" };
  }

  if (config.allowedRecipients.length > 0) {
    const allowedLower = config.allowedRecipients.map((a) => a.toLowerCase());
    if (!allowedLower.includes(recipientAddress.toLowerCase())) {
      return { allowed: false, reason: "Recipient not in allowed list" };
    }
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyTx, weeklyTx, monthlyTx] = await Promise.all([
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: todayStart }, status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: weekStart }, status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: monthStart }, status: "completed" },
      _sum: { amount: true },
    }),
  ]);

  const dailySpent = parseFloat(String(dailyTx._sum.amount ?? "0"));
  const weeklySpent = parseFloat(String(weeklyTx._sum.amount ?? "0"));
  const monthlySpent = parseFloat(String(monthlyTx._sum.amount ?? "0"));

  if (dailySpent + paymentAmount > parseFloat(config.dailySpendLimit)) {
    return { allowed: false, reason: `Would exceed daily limit (${config.dailySpendLimit} USDC)` };
  }

  if (weeklySpent + paymentAmount > parseFloat(config.weeklySpendLimit)) {
    return { allowed: false, reason: `Would exceed weekly limit (${config.weeklySpendLimit} USDC)` };
  }

  if (monthlySpent + paymentAmount > parseFloat(config.monthlySpendLimit)) {
    return { allowed: false, reason: `Would exceed monthly limit (${config.monthlySpendLimit} USDC)` };
  }

  if (ruleId) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (rule?.conditionMaxDailyTriggers) {
      const todayTriggers = await prisma.transaction.count({
        where: {
          configId,
          ruleId,
          createdAt: { gte: todayStart },
          status: "completed",
        },
      });
      if (todayTriggers >= rule.conditionMaxDailyTriggers) {
        return { allowed: false, reason: `Max daily triggers (${rule.conditionMaxDailyTriggers}) reached` };
      }
    }
  }

  return { allowed: true };
}
