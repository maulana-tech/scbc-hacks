"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAgentPayment } from "@/lib/use-agent-payment";
import {
  Code, FileText, Languages, Database, Regex as RegexIcon, Lightbulb,
  type LucideIcon, Loader2, Check, AlertCircle, Wallet, ArrowRight, ExternalLink, Copy, GitBranch,
} from "lucide-react";
import Link from "next/link";

const ICON_MAP: Record<string, LucideIcon> = {
  "code-review": Code,
  summarizer: FileText,
  translator: Languages,
  "sql-generator": Database,
  "regex-generator": RegexIcon,
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

const LANGUAGES = ["javascript", "typescript", "python", "solidity", "rust", "go", "java", "c++"];
const TARGET_LANGS = ["id", "en", "ja", "es", "fr", "de", "ko", "zh", "pt", "ar"];
const DIALECTS = ["postgresql", "mysql", "sqlite", "mssql"];

function RenderResult({ serviceType, data }: { serviceType: string; data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  switch (serviceType) {
    case "code-review": {
      const issues = (data.issues as Array<{ line: number; severity: string; message: string }>) || [];
      const score = data.score as number;
      const summary = data.summary as string;
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text">Score</span>
            <span className={`text-[24px] font-bold font-mono ${score >= 80 ? "text-accent" : score >= 50 ? "text-amber" : "text-red"}`}>
              {score}/100
            </span>
          </div>
          <div className="h-[3px] bg-surface-hover rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${score >= 80 ? "bg-accent" : score >= 50 ? "bg-amber" : "bg-red"}`} style={{ width: `${score}%` }} />
          </div>
          {issues.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-text-3 uppercase tracking-wide">Issues ({issues.length})</span>
              {issues.map((issue, i) => (
                <div key={i} className="bg-bg border border-border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 ${issue.severity === "error" ? "bg-red/10 text-red" : issue.severity === "warning" ? "bg-amber/10 text-amber" : "bg-accent/10 text-accent"}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[11px] text-text-3 font-mono">Line {issue.line}</span>
                  </div>
                  <p className="text-[13px] text-text-2">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
          {summary && (
            <div className="bg-bg border border-border p-3">
              <span className="text-[11px] text-text-3 uppercase tracking-wide">Summary</span>
              <p className="text-[13px] text-text-2 mt-1">{summary}</p>
            </div>
          )}
        </div>
      );
    }
    case "summarizer": {
      const summary = data.summary as string;
      const wordCount = data.wordCount as number;
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text">Summary</span>
            <span className="text-[11px] text-text-3 font-mono">{wordCount} words</span>
          </div>
          <div className="bg-bg border border-border p-4">
            <p className="text-[14px] text-text-2 leading-relaxed">{summary}</p>
          </div>
        </div>
      );
    }
    case "translator": {
      const translated = data.translatedText as string;
      const detected = data.detectedSourceLanguage as string;
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-text">Translation</span>
            <span className="text-[11px] text-text-3">from {detected}</span>
          </div>
          <div className="bg-bg border border-border p-4 relative">
            <p className="text-[14px] text-text-2 leading-relaxed pr-8">{translated}</p>
            <button onClick={() => handleCopy(translated)} className="absolute top-3 right-3 text-text-3 hover:text-text">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      );
    }
    case "sql-generator": {
      const query = data.query as string;
      const explanation = data.explanation as string;
      const warnings = data.warnings as string[];
      return (
        <div className="space-y-3">
          <span className="text-[13px] font-semibold text-text">Generated SQL</span>
          <div className="bg-bg border border-border p-4 relative">
            <pre className="text-[13px] text-accent font-mono whitespace-pre-wrap">{query}</pre>
            <button onClick={() => handleCopy(query)} className="absolute top-3 right-3 text-text-3 hover:text-text">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          {explanation && (
            <div className="bg-bg border border-border p-3">
              <span className="text-[11px] text-text-3 uppercase tracking-wide">Explanation</span>
              <p className="text-[13px] text-text-2 mt-1">{explanation}</p>
            </div>
          )}
          {warnings && warnings.length > 0 && (
            <div className="bg-amber/5 border border-amber/20 p-3">
              {warnings.map((w, i) => <p key={i} className="text-[12px] text-amber">{w}</p>)}
            </div>
          )}
        </div>
      );
    }
    case "regex-generator": {
      const pattern = data.pattern as string;
      const flags = data.flags as string;
      const explanation = data.explanation as string;
      return (
        <div className="space-y-3">
          <span className="text-[13px] font-semibold text-text">Generated Regex</span>
          <div className="bg-bg border border-border p-4 relative">
            <code className="text-[16px] text-accent font-mono">/{pattern}/{flags}</code>
            <button onClick={() => handleCopy(`/${pattern}/${flags}`)} className="absolute top-3 right-3 text-text-3 hover:text-text">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          {explanation && (
            <div className="bg-bg border border-border p-3">
              <span className="text-[11px] text-text-3 uppercase tracking-wide">Explanation</span>
              <p className="text-[13px] text-text-2 mt-1">{explanation}</p>
            </div>
          )}
        </div>
      );
    }
    case "code-explainer": {
      const summary = data.summary as string;
      const lineByLine = data.lineByLine as Array<{ line: string; explanation: string }>;
      return (
        <div className="space-y-3">
          {summary && (
            <div className="bg-bg border border-border p-3">
              <span className="text-[11px] text-text-3 uppercase tracking-wide">Summary</span>
              <p className="text-[13px] text-text-2 mt-1">{summary}</p>
            </div>
          )}
          {lineByLine && lineByLine.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-text-3 uppercase tracking-wide">Line-by-line</span>
              {lineByLine.map((item, i) => (
                <div key={i} className="bg-bg border border-border p-3">
                  <code className="text-[12px] text-accent font-mono">{item.line}</code>
                  <p className="text-[13px] text-text-2 mt-1">{item.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    default:
      return <pre className="text-[12px] text-text-2 font-mono bg-bg p-4 overflow-auto whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
  }
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
  const [step, setStep] = useState<"idle" | "input" | "confirm" | "signing" | "done" | "error">("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  const [inputCode, setInputCode] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputLang, setInputLang] = useState("javascript");
  const [inputFocus, setInputFocus] = useState("general");
  const [inputStyle, setInputStyle] = useState("paragraph");
  const [inputTargetLang, setInputTargetLang] = useState("id");
  const [inputDesc, setInputDesc] = useState("");
  const [inputDialect, setInputDialect] = useState("postgresql");
  const [inputPattern, setInputPattern] = useState("");
  const [inputFlavor, setInputFlavor] = useState("javascript");
  const [ghRepo, setGhRepo] = useState("");
  const [ghPath, setGhPath] = useState("");
  const [ghPr, setGhPr] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghFiles, setGhFiles] = useState<string[]>([]);
  const [ghMode, setGhMode] = useState<"file" | "pr">("file");

  const repPct = Math.round((reputationScore / 1000) * 100);
  const repColor = reputationScore >= 800 ? "#b7d941" : reputationScore >= 500 ? "#4ea8f6" : "#e8a830";

  function handleUse() {
    if (!isConnected) {
      setStep("error");
      setError("Connect your wallet first, then switch to Avalanche Fuji network.");
      return;
    }
    setStep("input");
  }

  function resetState() {
    setStep("idle");
    setResult(null);
    setError("");
  }

  function handleProceed() {
    setStep("confirm");
  }

  async function handleGithubLoad() {
    if (!ghRepo) return;
    setGhLoading(true);
    try {
      if (ghMode === "pr" && ghPr) {
        const res = await fetch(`/api/github/content?repo=${encodeURIComponent(ghRepo)}&pr=${ghPr}`);
        const data = await res.json();
        if (data.error) { setError(data.error); setStep("error"); return; }
        setInputCode(data.content || "");
        if (data.files?.[0]) {
          const ext = data.files[0].split(".").pop();
          const langMap: Record<string, string> = { ts: "typescript", tsx: "typescript", js: "javascript", py: "python", rs: "rust", go: "go", sol: "solidity" };
          if (ext && langMap[ext]) setInputLang(langMap[ext]);
        }
      } else if (ghPath) {
        const res = await fetch(`/api/github/content?repo=${encodeURIComponent(ghRepo)}&path=${encodeURIComponent(ghPath)}`);
        const data = await res.json();
        if (data.error) { setError(data.error); setStep("error"); return; }
        setInputCode(data.content || "");
        if (data.language) setInputLang(data.language);
      } else {
        const res = await fetch(`/api/github/content?repo=${encodeURIComponent(ghRepo)}`);
        const data = await res.json();
        if (data.error) { setError(data.error); setStep("error"); return; }
        setGhFiles(data.files || []);
        return;
      }
    } catch {
      setError("Failed to fetch from GitHub");
      setStep("error");
    } finally {
      setGhLoading(false);
    }
  }

  function buildPayload(): Record<string, unknown> {
    switch (serviceType) {
      case "code-review":
        return { code: inputCode || "function hello() { return 'world'; }", language: inputLang, focus: inputFocus };
      case "summarizer":
        return { text: inputText || "Sample text for summarization.", style: inputStyle, maxLength: 200 };
      case "translator":
        return { text: inputText || "Hello world", targetLanguage: inputTargetLang };
      case "sql-generator":
        return { description: inputDesc || "Get all users", dialect: inputDialect };
      case "regex-generator":
        return { description: inputPattern || "Match email addresses", flavor: inputFlavor };
      case "code-explainer":
        return { code: inputCode || "const add = (a, b) => a + b;", language: inputLang };
      default:
        return { input: "test" };
    }
  }

  async function handleConfirm() {
    setStep("signing");
    const payload = buildPayload();

    try {
      const { ok, data, error: err } = await payAndCall({
        agentEndpoint: `/api/agents/${serviceType}`,
        payload,
      });

      if (ok) {
        const txData = data as Record<string, unknown>;
        setStep("done");
        setResult(txData);
        saveLocalTransaction({
          id: `tx_${Date.now()}`,
          agentName: name,
          agentType: serviceType,
          amount: price,
          txHash: (txData?.txHash as string) || "",
          status: "success",
          result: JSON.stringify(data),
          timestamp: Date.now(),
        });
      } else {
        setStep("error");
        setError(err || "Unknown error occurred.");
      }
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function renderInputForm() {
    switch (serviceType) {
      case "code-review":
        return (
          <div className="space-y-3">
            <div className="bg-accent/5 border border-accent/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={14} className="text-accent" />
                <span className="text-[12px] font-medium text-accent">Load from GitHub</span>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setGhMode("file")} className={`text-[11px] px-2 py-1 ${ghMode === "file" ? "bg-accent text-bg" : "border border-border text-text-3"}`}>File</button>
                <button onClick={() => setGhMode("pr")} className={`text-[11px] px-2 py-1 ${ghMode === "pr" ? "bg-accent text-bg" : "border border-border text-text-3"}`}>PR Diff</button>
              </div>
              <div className="flex gap-2">
                <input value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="owner/repo" className="flex-1 bg-bg border border-border text-text text-[12px] px-2 py-1.5 focus:outline-none focus:border-border-strong" />
                {ghMode === "file" ? (
                  <>
                    <input value={ghPath} onChange={(e) => setGhPath(e.target.value)} placeholder="path/to/file.ts" className="flex-1 bg-bg border border-border text-text text-[12px] px-2 py-1.5 focus:outline-none focus:border-border-strong" />
                    <select value={""} onChange={(e) => { setGhPath(e.target.value); }} className="bg-bg border border-border text-text text-[11px] px-1 py-1 max-w-[140px] focus:outline-none">
                      <option value="">Pick file</option>
                      {ghFiles.map((f) => <option key={f} value={f}>{f.split("/").pop()}</option>)}
                    </select>
                  </>
                ) : (
                  <input value={ghPr} onChange={(e) => setGhPr(e.target.value)} placeholder="PR #" className="w-20 bg-bg border border-border text-text text-[12px] px-2 py-1.5 focus:outline-none focus:border-border-strong" />
                )}
                <button onClick={handleGithubLoad} disabled={ghLoading} className="bg-accent text-bg text-[11px] px-3 py-1.5 hover:bg-accent-hover disabled:opacity-50">
                  {ghLoading ? "..." : "Load"}
                </button>
              </div>
              {!ghPath && !ghPr && ghRepo && (
                <button onClick={async () => { setGhLoading(true); const r = await fetch(`/api/github/content?repo=${encodeURIComponent(ghRepo)}`); const d = await r.json(); setGhFiles(d.files || []); setGhLoading(false); }} className="text-[11px] text-accent mt-2 hover:underline">
                  Browse files...
                </button>
              )}
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Code</label>
              <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Paste code or load from GitHub..." rows={8} className="w-full bg-bg border border-border text-text text-[13px] font-mono p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] text-text-3 mb-1.5 block">Language</label>
                <select value={inputLang} onChange={(e) => setInputLang(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[12px] text-text-3 mb-1.5 block">Focus</label>
                <select value={inputFocus} onChange={(e) => setInputFocus(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                  <option value="general">General</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                  <option value="style">Style</option>
                </select>
              </div>
            </div>
          </div>
        );
      case "summarizer":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Text to summarize</label>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your text here (max 10,000 chars)..." rows={6} className="w-full bg-bg border border-border text-text text-[13px] p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Style</label>
              <select value={inputStyle} onChange={(e) => setInputStyle(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                <option value="paragraph">Paragraph</option>
                <option value="bullet">Bullet Points</option>
                <option value="tldr">TL;DR</option>
              </select>
            </div>
          </div>
        );
      case "translator":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Text to translate</label>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Enter text to translate..." rows={4} className="w-full bg-bg border border-border text-text text-[13px] p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Target Language</label>
              <select value={inputTargetLang} onChange={(e) => setInputTargetLang(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                {TARGET_LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        );
      case "sql-generator":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Describe what you need</label>
              <textarea value={inputDesc} onChange={(e) => setInputDesc(e.target.value)} placeholder="e.g. Get all users who signed up last month..." rows={4} className="w-full bg-bg border border-border text-text text-[13px] p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">SQL Dialect</label>
              <select value={inputDialect} onChange={(e) => setInputDialect(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                {DIALECTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        );
      case "regex-generator":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Describe the pattern</label>
              <textarea value={inputPattern} onChange={(e) => setInputPattern(e.target.value)} placeholder="e.g. Match email addresses, validate phone numbers..." rows={4} className="w-full bg-bg border border-border text-text text-[13px] p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Flavor</label>
              <select value={inputFlavor} onChange={(e) => setInputFlavor(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="golang">Go</option>
              </select>
            </div>
          </div>
        );
      case "code-explainer":
        return (
          <div className="space-y-3">
            <div className="bg-accent/5 border border-accent/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={14} className="text-accent" />
                <span className="text-[12px] font-medium text-accent">Load from GitHub</span>
              </div>
              <div className="flex gap-2">
                <input value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="owner/repo" className="flex-1 bg-bg border border-border text-text text-[12px] px-2 py-1.5 focus:outline-none focus:border-border-strong" />
                <input value={ghPath} onChange={(e) => setGhPath(e.target.value)} placeholder="path/to/file.ts" className="flex-1 bg-bg border border-border text-text text-[12px] px-2 py-1.5 focus:outline-none focus:border-border-strong" />
                <button onClick={handleGithubLoad} disabled={ghLoading} className="bg-accent text-bg text-[11px] px-3 py-1.5 hover:bg-accent-hover disabled:opacity-50">
                  {ghLoading ? "..." : "Load"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Code to explain</label>
              <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="Paste code or load from GitHub..." rows={8} className="w-full bg-bg border border-border text-text text-[13px] font-mono p-3 focus:outline-none focus:border-border-strong resize-none" />
            </div>
            <div>
              <label className="text-[12px] text-text-3 mb-1.5 block">Language</label>
              <select value={inputLang} onChange={(e) => setInputLang(e.target.value)} className="w-full bg-bg border border-border text-text text-[13px] p-2 focus:outline-none">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        );
      default:
        return <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={4} className="w-full bg-bg border border-border text-text text-[13px] p-3 focus:outline-none focus:border-border-strong resize-none" />;
    }
  }

  return (
    <>
      <div className="border border-border bg-surface p-5 hover:border-border-strong transition-colors group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-hover flex items-center justify-center group-hover:bg-accent-subtle transition-colors">
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
            <div className="h-full bg-accent rounded-full" style={{ width: `${repPct}%`, transition: "width 0.6s ease" }} />
          </div>
        </div>

        <div className="flex items-center justify-between type-caption text-text-3 mb-5">
          <span>{totalTxCount.toLocaleString()} txs</span>
          <span className="font-mono">{address}</span>
        </div>

        {!isConnected ? (
          <button onClick={handleUse} className="w-full h-9 bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
            <Wallet size={14} /> Connect to Use
          </button>
        ) : (
          <button
            onClick={handleUse}
            className="w-full h-9 bg-accent text-bg text-[13px] font-medium hover:bg-accent-hover transition-colors active:translate-y-px"
          >
            Use Agent
          </button>
        )}
      </div>

      {(step === "input" || step === "confirm" || step === "signing" || step === "done" || step === "error") && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={step === "done" || step === "error" ? resetState : undefined}>
          <div className="bg-surface border border-border max-w-lg w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>

            {step === "input" && (
              <>
                <div className="flex items-center gap-3 p-5 border-b border-border">
                  <div className="w-10 h-10 bg-accent-subtle flex items-center justify-center">
                    <Icon size={20} className="text-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="type-subheading text-text">{name}</h3>
                    <p className="text-[12px] text-text-3">{price} USDC per request</p>
                  </div>
                </div>
                <div className="p-5">
                  {renderInputForm()}
                </div>
                <div className="p-5 border-t border-border">
                  <div className="flex gap-3">
                    <button onClick={resetState} className="flex-1 h-10 border border-border text-text-2 text-[13px] font-medium hover:bg-surface-hover transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleProceed} className="flex-1 h-10 bg-accent text-bg text-[13px] font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
                      Continue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === "confirm" && (
              <>
                <div className="flex items-center gap-3 p-5 border-b border-border">
                  <div className="w-10 h-10 bg-accent-subtle flex items-center justify-center">
                    <Icon size={20} className="text-accent" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="type-subheading text-text">Confirm Payment</h3>
                    <p className="text-[12px] text-text-3">Review details before signing</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="bg-bg border border-border p-4 space-y-3">
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

                  <div className="bg-amber/5 border border-amber/20 p-3">
                    <p className="text-[12px] text-amber">
                      MetaMask will open to sign the transaction. Make sure you&apos;re on Avalanche Fuji network and have enough AVAX for gas.
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-border">
                  <div className="flex gap-3">
                    <button onClick={() => setStep("input")} className="flex-1 h-10 border border-border text-text-2 text-[13px] font-medium hover:bg-surface-hover transition-colors">
                      Back
                    </button>
                    <button onClick={handleConfirm} className="flex-1 h-10 bg-accent text-bg text-[13px] font-semibold hover:bg-accent-hover transition-colors flex items-center justify-center gap-2">
                      Sign & Pay <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === "signing" && (
              <div className="text-center py-12">
                <Loader2 size={32} className="text-accent animate-spin mx-auto mb-4" />
                <h3 className="type-subheading text-text mb-2">Waiting for Signature</h3>
                <p className="text-[13px] text-text-3">Open MetaMask and confirm the transaction...</p>
              </div>
            )}

            {step === "done" && result && (
              <>
                <div className="flex items-center gap-3 p-5 border-b border-border">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Check size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="type-subheading text-text">Result</h3>
                    <p className="text-[12px] text-accent">{price} USDC paid to {name}</p>
                  </div>
                </div>
                <div className="p-5">
                  <RenderResult serviceType={serviceType} data={result} />
                </div>
                <div className="p-5 border-t border-border">
                  <div className="flex gap-3">
                    <button onClick={resetState} className="flex-1 h-9 border border-border text-text text-[13px] font-medium hover:bg-surface-hover transition-colors">
                      Close
                    </button>
                    <Link href="/dashboard?tab=history" className="flex-1 h-9 bg-accent text-bg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
                      History <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </>
            )}

            {step === "error" && (
              <>
                <div className="flex items-center gap-3 p-5 border-b border-border">
                  <div className="w-8 h-8 bg-red/10 rounded-full flex items-center justify-center">
                    <AlertCircle size={18} className="text-red" />
                  </div>
                  <h3 className="type-subheading text-text">Error</h3>
                </div>
                <div className="p-5">
                  <div className="bg-bg border border-border p-4">
                    <p className="text-[13px] text-text-2">{error}</p>
                  </div>
                </div>
                <div className="p-5 border-t border-border">
                  <button onClick={resetState} className="w-full h-9 border border-border text-text text-[13px] font-medium hover:bg-surface-hover transition-colors">
                    Close
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
