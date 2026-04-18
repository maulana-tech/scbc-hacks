"use client";

import { useState } from "react";

interface SpendRuleFormProps {
  onSubmit: (rule: Record<string, unknown>) => void;
}

const inputCls =
  "w-full h-9 bg-surface-hover border border-border rounded-lg px-3 text-[13px] text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition-colors";

export default function SpendRuleForm({ onSubmit }: SpendRuleFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("subscription");
  const [amount, setAmount] = useState("0.05");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [scheduleFreq, setScheduleFreq] = useState("weekly");
  const [conditionTrigger, setConditionTrigger] = useState("manual");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      amount,
      recipientAddress: recipientAddress || undefined,
      schedule: type === "subscription" || type === "donation" ? { frequency: scheduleFreq } : undefined,
      condition: type === "tip" || type === "conditional" ? { trigger: conditionTrigger } : undefined,
      enabled: true,
    });
    setName("");
    setAmount("0.05");
    setRecipientAddress("");
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-surface rounded-xl p-5">
      <h3 className="type-caption text-text-3 mb-5">New Rule</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block type-caption text-text-3 mb-1.5">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekly payment" required className={inputCls} />
        </div>
        <div>
          <label className="block type-caption text-text-3 mb-1.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="subscription">Subscription</option>
            <option value="tip">Tip</option>
            <option value="donation">Donation</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block type-caption text-text-3 mb-1.5">Amount (USDC)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" min="0.01" required className={inputCls} />
        </div>
        <div>
          <label className="block type-caption text-text-3 mb-1.5">Recipient</label>
          <input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="0x…" className={inputCls} />
        </div>
      </div>

      {(type === "subscription" || type === "donation") && (
        <div className="mb-3">
          <label className="block type-caption text-text-3 mb-1.5">Frequency</label>
          <select value={scheduleFreq} onChange={(e) => setScheduleFreq(e.target.value)} className={inputCls}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="once">Once</option>
          </select>
        </div>
      )}

      {(type === "tip" || type === "conditional") && (
        <div className="mb-3">
          <label className="block type-caption text-text-3 mb-1.5">Trigger</label>
          <select value={conditionTrigger} onChange={(e) => setConditionTrigger(e.target.value)} className={inputCls}>
            <option value="manual">Manual</option>
            <option value="on_task_complete">On Task Complete</option>
            <option value="on_reputation_increase">On Reputation Increase</option>
          </select>
        </div>
      )}

      <button
        type="submit"
        className="w-full mt-3 h-9 rounded-lg bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors active:translate-y-px"
      >
        Add Rule
      </button>
    </form>
  );
}
