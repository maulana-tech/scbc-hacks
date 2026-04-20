export interface SpendRule {
  id: string;
  configId: string;
  name: string;
  type: "subscription" | "tip" | "donation" | "conditional";
  recipientAgentId?: string;
  recipientAddress?: string;
  amount: string;
  scheduleFrequency?: "daily" | "weekly" | "monthly" | "once";
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleTime?: string;
  conditionTrigger?: string;
  conditionMinReputation?: number;
  conditionMaxDailyTriggers?: number;
  enabled: boolean;
  expiresAt?: string;
  totalSpentToDate: string;
  createdAt: string;
}

export interface PayAgentConfig {
  id: string;
  ownerAddress: string;
  agentWalletAddress: string;
  dailySpendLimit: string;
  weeklySpendLimit: string;
  monthlySpendLimit: string;
  maxSinglePayment: string;
  allowedRecipients: string[];
  blockedRecipients: string[];
  isPaused: boolean;
  rules: SpendRule[];
}

export interface Transaction {
  id: string;
  configId: string;
  ruleId?: string;
  type: string;
  recipientAddress: string;
  amount: string;
  txHash?: string;
  status: "completed" | "failed" | "pending";
  createdAt: string;
  metadata?: string;
}

const configs = new Map<string, PayAgentConfig>();
const transactions = new Map<string, Transaction>();

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getOrCreateConfig(ownerAddress: string): PayAgentConfig {
  const existing = configs.get(ownerAddress);
  if (existing) return existing;

  const config: PayAgentConfig = {
    id: `cfg_${uid()}`,
    ownerAddress,
    agentWalletAddress: ownerAddress,
    dailySpendLimit: "5.00",
    weeklySpendLimit: "20.00",
    monthlySpendLimit: "50.00",
    maxSinglePayment: "2.00",
    allowedRecipients: [],
    blockedRecipients: [],
    isPaused: false,
    rules: [],
  };
  configs.set(ownerAddress, config);
  return config;
}

export function getConfig(ownerAddress: string): PayAgentConfig | undefined {
  return configs.get(ownerAddress);
}

export function updateConfig(ownerAddress: string, updates: Partial<PayAgentConfig>): PayAgentConfig | null {
  const config = configs.get(ownerAddress);
  if (!config) return null;
  const updated = { ...config, ...updates, ownerAddress: config.ownerAddress, id: config.id, rules: config.rules };
  configs.set(ownerAddress, updated);
  return updated;
}

export function setPaused(ownerAddress: string, paused: boolean): boolean {
  const config = configs.get(ownerAddress);
  if (!config) return false;
  config.isPaused = paused;
  return true;
}

export function addRule(ownerAddress: string, rule: Record<string, unknown>): SpendRule | null {
  const config = configs.get(ownerAddress);
  if (!config) return null;

  const newRule: SpendRule = {
    id: `rule_${uid()}`,
    configId: config.id,
    name: (rule.name as string) || "Untitled Rule",
    type: (rule.type as SpendRule["type"]) || "conditional",
    recipientAgentId: rule.recipientAgentId as string | undefined,
    recipientAddress: rule.recipientAddress as string | undefined,
    amount: (rule.amount as string) || "0.00",
    scheduleFrequency: (rule.schedule as Record<string, unknown>)?.frequency as SpendRule["scheduleFrequency"],
    scheduleDayOfWeek: (rule.schedule as Record<string, unknown>)?.dayOfWeek as number | undefined,
    scheduleDayOfMonth: (rule.schedule as Record<string, unknown>)?.dayOfMonth as number | undefined,
    scheduleTime: (rule.schedule as Record<string, unknown>)?.time as string | undefined,
    conditionTrigger: (rule.condition as Record<string, unknown>)?.trigger as string | undefined,
    conditionMinReputation: (rule.condition as Record<string, unknown>)?.minReputationScore as number | undefined,
    conditionMaxDailyTriggers: (rule.condition as Record<string, unknown>)?.maxDailyTriggers as number | undefined,
    enabled: rule.enabled !== undefined ? Boolean(rule.enabled) : true,
    expiresAt: rule.expiresAt as string | undefined,
    totalSpentToDate: "0.00",
    createdAt: new Date().toISOString(),
  };
  config.rules.push(newRule);
  return newRule;
}

export function updateRule(ownerAddress: string, ruleId: string, updates: Record<string, unknown>): SpendRule | null {
  const config = configs.get(ownerAddress);
  if (!config) return null;
  const idx = config.rules.findIndex((r) => r.id === ruleId);
  if (idx === -1) return null;

  const rule = config.rules[idx];
  if (updates.name !== undefined) rule.name = updates.name as string;
  if (updates.enabled !== undefined) rule.enabled = Boolean(updates.enabled);
  if (updates.amount !== undefined) rule.amount = updates.amount as string;
  if (updates.recipientAddress !== undefined) rule.recipientAddress = updates.recipientAddress as string;

  return rule;
}

export function deleteRule(ownerAddress: string, ruleId: string): boolean {
  const config = configs.get(ownerAddress);
  if (!config) return false;
  const idx = config.rules.findIndex((r) => r.id === ruleId);
  if (idx === -1) return false;
  config.rules.splice(idx, 1);
  return true;
}

export function addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Transaction {
  const record: Transaction = {
    id: `tx_${uid()}`,
    createdAt: new Date().toISOString(),
    ...tx,
  };
  transactions.set(record.id, record);
  return record;
}

export function getTransactions(configId: string, limit = 50): Transaction[] {
  return Array.from(transactions.values())
    .filter((t) => t.configId === configId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getSpendingStats(configId: string, config: PayAgentConfig) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const all = Array.from(transactions.values()).filter(
    (t) => t.configId === configId && t.status === "completed"
  );

  const sum = (txs: Transaction[]) =>
    txs.reduce((acc, t) => acc + parseFloat(t.amount), 0).toFixed(2);

  const daily = all.filter((t) => new Date(t.createdAt) >= todayStart);
  const weekly = all.filter((t) => new Date(t.createdAt) >= weekStart);
  const monthly = all.filter((t) => new Date(t.createdAt) >= monthStart);

  return {
    today: { spent: sum(daily), limit: config.dailySpendLimit, remaining: (parseFloat(config.dailySpendLimit) - parseFloat(sum(daily))).toFixed(2), txCount: daily.length },
    thisWeek: { spent: sum(weekly), limit: config.weeklySpendLimit, remaining: (parseFloat(config.weeklySpendLimit) - parseFloat(sum(weekly))).toFixed(2), txCount: weekly.length },
    thisMonth: { spent: sum(monthly), limit: config.monthlySpendLimit, remaining: (parseFloat(config.monthlySpendLimit) - parseFloat(sum(monthly))).toFixed(2), txCount: monthly.length },
    allTime: { spent: sum(all), txCount: all.length },
  };
}

export function getAllActiveConfigs(): PayAgentConfig[] {
  return Array.from(configs.values()).filter((c) => !c.isPaused);
}

export function enforceSpendingLimits(
  config: PayAgentConfig,
  amount: string,
  recipient: string,
  ruleId?: string
): { allowed: boolean; reason?: string } {
  if (config.isPaused) return { allowed: false, reason: "Payments paused" };

  const paymentAmount = parseFloat(amount);
  if (paymentAmount > parseFloat(config.maxSinglePayment)) {
    return { allowed: false, reason: `Amount ${amount} exceeds max single payment ${config.maxSinglePayment}` };
  }

  const blockedLower = config.blockedRecipients.map((a) => a.toLowerCase());
  if (blockedLower.includes(recipient.toLowerCase())) {
    return { allowed: false, reason: "Recipient is blocked" };
  }

  if (config.allowedRecipients.length > 0) {
    const allowedLower = config.allowedRecipients.map((a) => a.toLowerCase());
    if (!allowedLower.includes(recipient.toLowerCase())) {
      return { allowed: false, reason: "Recipient not in allowed list" };
    }
  }

  if (ruleId) {
    const rule = config.rules.find((r) => r.id === ruleId);
    if (!rule) return { allowed: false, reason: "Rule not found" };
    if (!rule.enabled) return { allowed: false, reason: "Rule disabled" };
  }

  const stats = getSpendingStats(config.id, config);
  if (parseFloat(stats.today.spent) + paymentAmount > parseFloat(config.dailySpendLimit)) {
    return { allowed: false, reason: `Would exceed daily limit (${config.dailySpendLimit} USDC)` };
  }
  if (parseFloat(stats.thisWeek.spent) + paymentAmount > parseFloat(config.weeklySpendLimit)) {
    return { allowed: false, reason: `Would exceed weekly limit (${config.weeklySpendLimit} USDC)` };
  }
  if (parseFloat(stats.thisMonth.spent) + paymentAmount > parseFloat(config.monthlySpendLimit)) {
    return { allowed: false, reason: `Would exceed monthly limit (${config.monthlySpendLimit} USDC)` };
  }

  return { allowed: true };
}
