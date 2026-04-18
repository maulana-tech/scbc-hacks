import cron from "node-cron";
import { prisma } from "./db";
import { enforceSpendingLimits } from "./spend-enforcer";
import { ethers } from "ethers";

function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

function getTodayDayOfMonth(): number {
  return new Date().getDate();
}

async function executeRecurringPayments() {
  const configs = await prisma.payAgentConfig.findMany({
    where: { isPaused: false },
    include: { rules: true },
  });

  const dayOfWeek = getTodayDayOfWeek();
  const dayOfMonth = getTodayDayOfMonth();

  for (const config of configs) {
    for (const rule of config.rules) {
      if (!rule.enabled) continue;
      if (rule.type !== "subscription" && rule.type !== "donation") continue;
      if (!rule.scheduleFrequency) continue;

      let shouldRun = false;

      switch (rule.scheduleFrequency) {
        case "daily":
          shouldRun = true;
          break;
        case "weekly":
          shouldRun = rule.scheduleDayOfWeek === dayOfWeek;
          break;
        case "monthly":
          shouldRun = rule.scheduleDayOfMonth === dayOfMonth;
          break;
        case "once":
          const existingTx = await prisma.transaction.findFirst({
            where: { configId: config.id, ruleId: rule.id, status: "completed" },
          });
          shouldRun = !existingTx;
          break;
      }

      if (!shouldRun) continue;

      const recipient = rule.recipientAddress || rule.recipientAgentId;
      if (!recipient) continue;

      const result = await enforceSpendingLimits(config.id, rule.amount, recipient, rule.id);
      if (!result.allowed) {
        console.log(`Skipped rule ${rule.name}: ${result.reason}`);
        continue;
      }

      try {
        const txHash = await submitPayment(config.agentWalletAddress, recipient, rule.amount);

        await prisma.transaction.create({
          data: {
            configId: config.id,
            ruleId: rule.id,
            type: rule.type,
            recipientAddress: recipient,
            amount: rule.amount,
            txHash,
            status: "completed",
          },
        });

        await prisma.spendRule.update({
          where: { id: rule.id },
          data: {
            totalSpentToDate: (parseFloat(rule.totalSpentToDate) + parseFloat(rule.amount)).toFixed(2),
          },
        });

        console.log(`Executed ${rule.type}: ${rule.amount} USDC to ${recipient}`);
      } catch (error) {
        console.error(`Failed to execute rule ${rule.name}:`, error);
        await prisma.transaction.create({
          data: {
            configId: config.id,
            ruleId: rule.id,
            type: rule.type,
            recipientAddress: recipient,
            amount: rule.amount,
            status: "failed",
            metadata: JSON.stringify({ error: String(error) }),
          },
        });
      }
    }
  }
}

async function submitPayment(
  fromAddress: string,
  toAddress: string,
  amount: string
): Promise<string> {
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

export function startScheduler() {
  cron.schedule("0 * * * *", async () => {
    console.log("[Scheduler] Running recurring payments check...");
    await executeRecurringPayments();
  });

  console.log("[Scheduler] PayAgent scheduler started (hourly)");
}
