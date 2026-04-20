"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useAgentPayment } from "@/lib/use-agent-payment";
import { Code, FileText, Languages, Database, Regex, Lightbulb, type LucideIcon, Loader2, Check, AlertCircle, Wallet, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, LucideIcon> = {
  "code-review": Code,
  summarizer: FileText,
  translator: Languages,
  "sql-generator": Database,
  "regex-generator": Regex,
  "code-explainer": Lightbulb,
};

export interface LocalTransaction {
  id: string;
  agentName: string;
  agentType: string;
  amount: string;
  txHash: string;
  status: "success" | "error";
  result?: string;
  timestamp: number;
}

const STORAGE_KEY = "vaxa_tx_history";

export function getLocalTransactions(): LocalTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalTransaction(tx: LocalTransaction) {
  if (typeof window === "undefined") return;
  const existing = getLocalTransactions();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([tx, ...existing].slice(0, 50)));
}

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
  const { isConnected } = useAccount();
  const { payAndCall } = useAgentPayment();
  const [step, setStep] = useState<"idle" | "confirm" | "signing" | "done" | "error">("idle");
  const [result, setResult] = useState<string>("");
  const [lastTxHash, setLastTxHash] = useState<string>("");

  const repPct = Math.round((reputationScore / 1000) * 100);
  const repColor = reputationScore >= 800 ? "#b7d941" : reputationScore >= 500 ? "#4ea8f6" : "#e8a830";

  function handleUse() {
    if (!isConnected) {
      setStep("error");
      setResult("Connect your wallet first, then switch to Avalanche Fuji network.");
      return;
    }
    setStep("confirm");
  }

  function handleCancel() {
    setStep("idle");
    setResult("");
  }

  async function handleConfirm() {
    setStep("signing");

    let payload: Record<string, unknown> = {};
    switch (serviceType) {
      case "code-review":
        payload = { code: "function hello() { return 'world'; }", language: "typescript", focus: "general" };
        break;
      case "summarizer":
        payload = { text: "This is a sample text that needs to be summarized into a concise summary.", style: "bullet", maxLength: 100 };
        break;
      case "translator":
        payload = { text: "Hello world", targetLanguage: "es" };
        break;
      case "sql-generator":
        payload = { description: "Get all users created after 2024", dialect: "postgresql" };
        break;
      case "regex-generator":
        payload = { pattern: "Validate email addresses", flags: "gi" };
        break;
      case "code-explainer":
        payload = { code: "const add = (a, b) => a + b;", language: "javascript" };
        break;
      default:
        payload = { input: "test" };
    }

    try {
      const { ok, data, error } = await payAndCall({
        agentEndpoint: `/api/agents/${serviceType}`,
        payload,
      });

      if (ok) {
        const txData = data as { txHash?: string; summary?: string; translatedText?: string; [k: string]: unknown };
        setStep("done");
        setResult(JSON.stringify(data, null, 2));

        saveLocalTransaction({
          id: `tx_${Date.now()}`,
          agentName: name,
          agentType: serviceType,
          amount: price,
          txHash: txData?.txHash || "",
          status: "success",
          result: typeof data === "object" && data !== null ? JSON.stringify(data) : String(data),
          timestamp: Date.now(),
        });
      } else {
        setStep("error");
        setResult(error || "Unknown error occurred.");
      }
    } catch (err) {
      setStep("error");
      setResult(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
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

        {!isConnected ? (
          <div className="space-y-2">
            <button onClick={handleUse} className="w-full h-9 rounded-lg bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
              <Wallet size={14} /> Connect to Use
            </button>
          </div>
        ) : (
          <button
            onClick={handleUse}
            disabled={step === "signing"}
            className="w-full h-9 rounded-lg bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors active:translate-y-px disabled:opacity-50 disabled:cursor-wait"
          >
            {step === "signing" ? "Check Wallet..." : "Use Agent"}
          </button>
        )}
      </div>

      {(step === "confirm" || step === "signing" || step === "done" || step === "error") && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={step === "done" || step === "error" ? handleCancel : undefined}>
          <div className="bg-surface border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>

            {step === "confirm" && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-accent-subtle rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="type-subheading text-text">Confirm Payment</h3>
                    <p className="text-[12px] text-text-3">Review details before signing</p>
                  </div>
                </div>

                <div className="bg-bg border border-border rounded-lg p-4 space-y-3 mb-5">
                  <div className="flex justify-between">
                    <span className="text-[13px] text-text-3">Agent</span>
                    <span className="text-[13px] font-medium text-text">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[13px] text-text-3">Network</span>
                    <span className="text-[13px] text-text font-mono">Avalanche Fuji</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="text-[13px] text-text-3">Amount</span>
                    <span className="text-[18px] font-bold text-accent font-mono">{price} USDC</span>
                  </div>
                </div>

                <div className="bg-amber/5 border border-amber/20 rounded-lg p-3 mb-5">
                  <p className="text-[12px] text-amber">
                    MetaMask will open to sign the transaction. Make sure you're on Avalanche Fuji network and have enough AVAX for gas.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleCancel} className="flex-1 h-10 border border-border rounded-lg text-text-2 text-[13px] font-medium hover:bg-surface-hover transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleConfirm} className="flex-1 h-10 bg-accent text-bg rounded-lg text-[13px] font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
                    Sign & Pay <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {step === "signing" && (
              <div className="text-center py-8">
                <Loader2 size={32} className="text-accent animate-spin mx-auto mb-4" />
                <h3 className="type-subheading text-text mb-2">Waiting for Signature</h3>
                <p className="text-[13px] text-text-3">Open MetaMask and confirm the transaction...</p>
              </div>
            )}

            {step === "done" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Check size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="type-subheading text-text">Payment Successful</h3>
                    <p className="text-[12px] text-accent">{price} USDC sent to {name}</p>
                  </div>
                </div>
                <pre className="text-[12px] text-text-2 font-mono bg-bg rounded-lg p-4 overflow-auto whitespace-pre-wrap max-h-[300px]">
                  {result}
                </pre>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleCancel} className="flex-1 h-9 border border-border rounded-lg text-text text-[13px] font-medium hover:bg-surface-hover transition-colors">
                    Close
                  </button>
                  <Link href="/dashboard?tab=history" className="flex-1 h-9 bg-accent text-bg rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
                    View History <ExternalLink size={12} />
                  </Link>
                </div>
              </>
            )}

            {step === "error" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red/10 rounded-full flex items-center justify-center">
                    <AlertCircle size={18} className="text-red" />
                  </div>
                  <h3 className="type-subheading text-text">Error</h3>
                </div>
                <div className="bg-bg border border-border rounded-lg p-4 mb-4">
                  <p className="text-[13px] text-text-2">{result}</p>
                </div>
                <button onClick={handleCancel} className="w-full h-9 border border-border rounded-lg text-text text-[13px] font-medium hover:bg-surface-hover transition-colors">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
