import { prisma } from "../../lib/db";

export { executePayment } from "./rule-executor";
export { getTransactionHistory, getSpendingStats } from "./history";

export async function getOrCreateConfig(ownerAddress: string) {
  let config = await prisma.payAgentConfig.findUnique({
    where: { ownerAddress },
    include: { rules: true },
  });

  if (!config) {
    config = await prisma.payAgentConfig.create({
      data: {
        ownerAddress,
        agentWalletAddress: ownerAddress,
      },
      include: { rules: true },
    });
  }

  return config;
}
