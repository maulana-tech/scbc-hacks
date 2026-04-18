"use client";

import { Code, FileText, Languages, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "code-review": Code,
  summarizer: FileText,
  translator: Languages,
};

interface AgentCardProps {
  name: string;
  serviceType: string;
  price: string;
  reputationScore: number;
  totalTxCount: number;
  address: string;
  description: string;
}

export default function AgentCard({
  name,
  serviceType,
  price,
  reputationScore,
  totalTxCount,
  address,
  description,
}: AgentCardProps) {
  const Icon = ICON_MAP[serviceType] || Code;
  const repPct = Math.round((reputationScore / 1000) * 100);
  const repColor = reputationScore >= 800 ? "#00d4aa" : reputationScore >= 500 ? "#4ea8f6" : "#e8a830";

  return (
    <div className="border border-border bg-surface rounded-xl p-5 hover:border-border-strong transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center group-hover:bg-accent-subtle transition-colors">
            <Icon size={18} className="text-text-3 group-hover:text-accent transition-colors" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="type-subheading text-text">{name}</h3>
            <span className="type-caption text-text-3">{serviceType}</span>
          </div>
        </div>
        <div className="text-right pt-0.5">
          <span className="text-[20px] font-semibold text-accent font-mono">{price}</span>
          <span className="text-[11px] text-text-3 ml-0.5">USDC</span>
        </div>
      </div>

      <p className="type-body-sm text-text-2 mb-5 leading-relaxed">{description}</p>

      <div className="mb-5">
        <div className="flex justify-between mb-1.5">
          <span className="type-caption text-text-3">Reputation</span>
          <span className="font-mono text-[12px] font-medium" style={{ color: repColor }}>{reputationScore}</span>
        </div>
        <div className="h-[3px] bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{ width: `${repPct}%`, transition: "width 0.6s ease" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between type-caption text-text-3 mb-5">
        <span>{totalTxCount.toLocaleString()} txs</span>
        <span className="font-mono">{address}</span>
      </div>

      <button className="w-full h-9 rounded-lg bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors active:translate-y-px">
        Use Agent
      </button>
    </div>
  );
}
