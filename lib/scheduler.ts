import cron from "node-cron";
import { prisma } from "./db";
import { enforceSpendingLimits } from "./spend-enforcer";
import { getSignedContract } from "./contracts";
import { ethers } from "ethers";

function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

function getTodayDayOfMonth(): number {
  return new Date().getDate();
}

async function submitPayment(
  fromPrivateKey: string,
  toAddress: string,
  amount: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(
    process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  );
  const wallet = new ethers.Wallet(fromPrivateKey, provider);

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

async function getAgentReputation(agentAddress: string): Promise<number> {
  try {
    const contract = getSignedContract();
    const score = await contract.getReputationScore(agentAddress);
    return Number(score);
  } catch {
    return 0;
  }
}

async function executeRecurringPayments() {
  const configs = await prisma.payAgentConfig.findMany({
    where: { isPaused: false },
    include: { rules: true },
  });

  const dayOfWeek = getTodayDayOfWeek();
  const dayOfMonth = getTodayDayOfMonth();
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  for (const config of configs) {
    for (const rule of config.rules) {
      if (!rule.enabled) continue;
      if (rule.type !== "subscription" && rule.type !== "donation") continue;
      if (!rule.scheduleFrequency) continue;

      if (rule.expiresAt && new Date(rule.expiresAt) < now) continue;

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
        case "once": {
          const existingTx = await prisma.transaction.findFirst({
            where: { configId: config.id, ruleId: rule.id, status: "completed" },
          });
          shouldRun = !existingTx;
          break;
        }
      }

      if (!shouldRun) continue;

      if (rule.scheduleTime) {
        const [h, m] = rule.scheduleTime.split(":").map(Number);
        if (currentHour !== h || Math.abs(currentMinute - m) > 30) continue;
      }

      const recipient = rule.recipientAddress || rule.recipientAgentId;
      if (!recipient) continue;

      if (rule.conditionMinReputation) {
        const rep = await getAgentReputation(recipient);
        if (rep < rule.conditionMinReputation) {
          console.log(`Skipped ${rule.name}: reputation ${rep} < ${rule.conditionMinReputation}`);
          continue;
        }
      }

      const result = await enforceSpendingLimits(config.id, rule.amount, recipient, rule.id);
      if (!result.allowed) {
        console.log(`Skipped ${rule.name}: ${result.reason}`);
        continue;
      }

      try {
        const privateKey = process.env.PAY_AGENT_PRIVATE_KEY!;
        const txHash = await submitPayment(privateKey, recipient, rule.amount);

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

        console.log(`Executed ${rule.type}: ${rule.amount} USDC to ${recipient} (${txHash})`);
      } catch (error) {
        console.error(`Failed rule ${rule.name}:`, error);
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

export function startScheduler() {
  cron.schedule("0 * * * *", async () => {
    console.log(`[Scheduler ${new Date().toISOString()}] Running recurring payments...`);
    await executeRecurringPayments();
  });
  console.log("[Scheduler] PayAgent scheduler started (hourly)");
}

startScheduler();
