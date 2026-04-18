import { prisma } from "../../lib/db";

export async function getTransactionHistory(configId: string, limit = 50) {
  return prisma.transaction.findMany({
    where: { configId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSpendingStats(configId: string) {
  const config = await prisma.payAgentConfig.findUnique({ where: { id: configId } });
  if (!config) throw new Error("Config not found");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyTx, weeklyTx, monthlyTx, allTx] = await Promise.all([
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: todayStart }, status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: weekStart }, status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { configId, createdAt: { gte: monthStart }, status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { configId, status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const fmt = (v: { toString: () => string } | null) => (v ? parseFloat(v.toString()).toFixed(2) : "0.00");

  return {
    today: {
      spent: fmt(dailyTx._sum.amount),
      limit: config.dailySpendLimit,
      remaining: (parseFloat(config.dailySpendLimit) - parseFloat(fmt(dailyTx._sum.amount))).toFixed(2),
      txCount: dailyTx._count,
    },
    thisWeek: {
      spent: fmt(weeklyTx._sum.amount),
      limit: config.weeklySpendLimit,
      remaining: (parseFloat(config.weeklySpendLimit) - parseFloat(fmt(weeklyTx._sum.amount))).toFixed(2),
      txCount: weeklyTx._count,
    },
    thisMonth: {
      spent: fmt(monthlyTx._sum.amount),
      limit: config.monthlySpendLimit,
      remaining: (parseFloat(config.monthlySpendLimit) - parseFloat(fmt(monthlyTx._sum.amount))).toFixed(2),
      txCount: monthlyTx._count,
    },
    allTime: {
      spent: fmt(allTx._sum.amount),
      txCount: allTx._count,
    },
  };
}
