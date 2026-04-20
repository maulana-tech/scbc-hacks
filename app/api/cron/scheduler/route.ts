import { NextResponse } from "next/server";
import {
  getAllActiveConfigs,
  enforceSpendingLimits,
  addTransaction,
  type PayAgentConfig,
  type SpendRule,
} from "@/lib/payagent-store";

async function submitPayment(toAddress: string, amount: string): Promise<string> {
  const { ethers } = await import("ethers");
  const provider = new ethers.JsonRpcProvider(
    process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  );
  const wallet = new ethers.Wallet(process.env.PAY_AGENT_PRIVATE_KEY!, provider);
  const usdc = new ethers.Contract(
    process.env.USDC_CONTRACT_ADDRESS!,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    wallet
  );
  const tx = await usdc.transfer(toAddress, ethers.parseUnits(amount, 6));
  await tx.wait();
  return tx.hash;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const executed: string[] = [];
  const skipped: string[] = [];
  const dayOfWeek = new Date().getDay();
  const dayOfMonth = new Date().getDate();
  const now = new Date();
  const currentHour = now.getUTCHours();

  const activeConfigs = getAllActiveConfigs();

  for (const config of activeConfigs) {
    for (const rule of config.rules) {
      if (!rule.enabled) { skipped.push(`${rule.name}: disabled`); continue; }
      if (rule.type !== "subscription" && rule.type !== "donation") continue;
      if (!rule.scheduleFrequency) continue;
      if (rule.expiresAt && new Date(rule.expiresAt) < now) { skipped.push(`${rule.name}: expired`); continue; }

      let shouldRun = false;
      switch (rule.scheduleFrequency) {
        case "daily": shouldRun = true; break;
        case "weekly": shouldRun = rule.scheduleDayOfWeek === dayOfWeek; break;
        case "monthly": shouldRun = rule.scheduleDayOfMonth === dayOfMonth; break;
        case "once": {
          const existingTxs = Array.from({ length: 0 }).length;
          shouldRun = existingTxs === 0;
          break;
        }
      }
      if (!shouldRun) { skipped.push(`${rule.name}: not scheduled`); continue; }

      if (rule.scheduleTime) {
        const h = parseInt(rule.scheduleTime.split(":")[0]);
        if (currentHour !== h) { skipped.push(`${rule.name}: wrong hour`); continue; }
      }

      const recipient = rule.recipientAddress || rule.recipientAgentId;
      if (!recipient) { skipped.push(`${rule.name}: no recipient`); continue; }

      const result = enforceSpendingLimits(config, rule.amount, recipient, rule.id);
      if (!result.allowed) { skipped.push(`${rule.name}: ${result.reason}`); continue; }

      try {
        const txHash = await submitPayment(recipient, rule.amount);

        addTransaction({
          configId: config.id,
          ruleId: rule.id,
          type: rule.type,
          recipientAddress: recipient,
          amount: rule.amount,
          txHash,
          status: "completed",
        });

        rule.totalSpentToDate = (parseFloat(rule.totalSpentToDate) + parseFloat(rule.amount)).toFixed(2);

        executed.push(`${rule.name}: ${rule.amount} USDC -> ${recipient} (${txHash.slice(0, 10)}...)`);
      } catch (error) {
        addTransaction({
          configId: config.id,
          ruleId: rule.id,
          type: rule.type,
          recipientAddress: recipient,
          amount: rule.amount,
          status: "failed",
          metadata: String(error),
        });
        skipped.push(`${rule.name}: tx failed`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    configsChecked: activeConfigs.length,
    executed,
    skipped,
  });
}
