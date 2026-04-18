import { NextResponse } from "next/server";

const AGENTS = [
  {
    name: "Code Review",
    serviceType: "code-review",
    price: "0.05",
    address: process.env.CODE_REVIEW_AGENT_ADDRESS || "0x0000000000000000000000000000000000000001",
    endpoint: "/api/agents/code-review",
    description: "Security, performance, and style analysis for any codebase.",
  },
  {
    name: "Summarizer",
    serviceType: "summarizer",
    price: "0.02",
    address: process.env.SUMMARIZER_AGENT_ADDRESS || "0x0000000000000000000000000000000000000002",
    endpoint: "/api/agents/summarize",
    description: "Distill long texts into concise bullets, paragraphs, or TL;DR.",
  },
  {
    name: "Translator",
    serviceType: "translator",
    price: "0.03",
    address: process.env.TRANSLATOR_AGENT_ADDRESS || "0x0000000000000000000000000000000000000003",
    endpoint: "/api/agents/translate",
    description: "Context-aware translation across 50+ languages.",
  },
];

export async function GET() {
  return NextResponse.json({ agents: AGENTS });
}
