# Vaxa — Planning & Status

> AI agent marketplace on Avalanche C-Chain (Fuji testnet).
> Pay per request via x402. Build on-chain reputation via ERC-8004.

---

## Hackathon Track

**Avalanche — Agentic Payments ($7,500)**

> x402 activates the HTTP 402 status code to make payments native to the internet — any API call can require and settle a stablecoin payment in ~2 seconds, with no accounts, no API keys, and no gas fees for the payer. Combined with ERC-8004 for on-chain agent identity and reputation, Avalanche gives developers the full stack to build applications where AI agents transact, earn trust, and operate independently.

### Requirements Met ✅
- ✅ Avalanche C-Chain as settlement layer
- ✅ x402 for HTTP-native, pay-per-request payments
- ✅ ERC-8004 for agent identity, reputation, trust verification
- ✅ Projects deployed on Avalanche (Vercel)

### Enhancement Opportunities
- 🔄 Interchain Messaging (ICM) for cross-L1 communication
- 🎯 Smart Escrow Agent (payment held until conditions met)
- 🧭 Routing Agent (compare services, select best by price/reputation)
- 🔗 Agent Composition (A2A - agents calling agents)
- 📦 More powerful service agents

---

## Status Overview

| Area | Progress | Status |
|------|----------|--------|
| Smart Contract | 100% | Solidity compilation, deploy script, ABI all working |
| Database (Prisma) | 100% | Schema complete, push to local DB done |
| Core Libs | 100% | x402, contracts, agent-client, spend-enforcer, scheduler — all functional |
| Service Agents | 100% | Code review, summarizer, translator — wired to OpenAI (OpenRouter/GLM) |
| PayAgent Core | 100% | Config/rules/stats/history/pause/resume API routes — real USDC payments |
| UI | 100% | Landing page, marketplace, dashboard — all with wallet connection + x402 flow |
| Deployment | 100% | Vercel deployed: https://vaxa.vercel.app |

---

## File Status Map

### Contracts

| File | Status | Notes |
|------|--------|-------|
| `contracts/AgentRegistry.sol` | DONE | Full ERC-8004: register, recordSuccessfulTx, reputation, deactivate |
| `contracts/abis/AgentRegistry.json` | DONE | Complete ABI matching contract |
| `contracts/compile.ts` | DONE | solc-js compilation pipeline |
| `scripts/deploy-contracts.ts` | DONE | Compiles + deploys to Fuji |

### Prisma / DB

| File | Status | Notes |
|------|--------|-------|
| `prisma/schema.prisma` | DONE | PayAgentConfig, SpendRule, Transaction, AgentCache |
| `lib/db.ts` | DONE | Prisma singleton |

### Libs

| File | Status | Notes |
|------|--------|-------|
| `lib/contracts.ts` | DONE | ethers.js contract instances (read-only & signed) |
| `lib/x402-middleware.ts` | DONE | 402 response builder, on-chain payment verification, reputation recording |
| `lib/agent-client.ts` | DONE | callAgentWithPayment() — full A2A x402 flow |
| `lib/spend-enforcer.ts` | DONE | All 10 enforcement checks from spec |
| `lib/scheduler.ts` | DONE | Real USDC transfers, reputation checks, time-based scheduling |
| `lib/ai.ts` | DONE | OpenRouter/GLM abstraction layer |

### Service Agents (Current)

| Agent | Price | Status |
|-------|-------|--------|
| Code Review | 0.05 USDC | DONE |
| Summarizer | 0.02 USDC | DONE |
| Translator | 0.03 USDC | DONE |

### Service Agents (To Add - Enhancement)

| Agent | Price | Priority | Description |
|-------|-------|----------|--------------|
| SQL Generator | 0.04 USDC | HIGH | Natural language → SQL query |
| Regex Generator | 0.03 USDC | HIGH | Description → regex pattern |
| Code Explainer | 0.02 USDC | HIGH | Plain english code explanations |
| Smart Contract Auditor | 0.08 USDC | HIGH | Security review for Solidity |
| Gas Optimizer | 0.06 USDC | MEDIUM | Gas savings suggestions |
| README Generator | 0.05 USDC | MEDIUM | Codebase → README.md |

### API Routes

| File | Status | Notes |
|------|--------|-------|
| `app/api/agents/code-review/route.ts` | DONE | Full x402 flow + AI + reputation |
| `app/api/agents/summarize/route.ts` | DONE | Full x402 flow + AI + reputation |
| `app/api/agents/translate/route.ts` | DONE | Full x402 flow + AI + reputation |
| `app/api/agents/tip/route.ts` | DONE | With recordSuccessfulTx |
| `app/api/agents/route.ts` | DONE | GET endpoint for agent list |
| `app/api/payagent/config/route.ts` | DONE | GET/PUT with upsert |
| `app/api/payagent/rules/route.ts` | DONE | GET/POST/PATCH/DELETE |
| `app/api/payagent/history/route.ts` | DONE | GET with limit param |
| `app/api/payagent/stats/route.ts` | DONE | GET with daily/weekly/monthly/all-time |
| `app/api/payagent/pause/route.ts` | DONE | POST to pause PayAgent |
| `app/api/payagent/resume/route.ts` | DONE | POST to resume PayAgent |
| `app/api/cron/scheduler/route.ts` | DONE | Vercel cron-compatible endpoint |

### UI

| File | Status | Notes |
|------|--------|-------|
| `app/globals.css` | DONE | Design system: charcoal dark theme, accent #b7d941 |
| `app/layout.tsx` | DONE | Fixed header, Geist fonts, SmoothScroll (Lenis) |
| `app/page.tsx` | DONE | Full landing with sections, editorial serif |
| `app/marketplace/page.tsx` | DONE | Agent listing with search, filters |
| `app/dashboard/page.tsx` | DONE | Collapsible sidebar, balance card, stats, rules |
| `components/AgentCard.tsx` | DONE | x402 payment modal with wallet connect |
| `components/navbar.tsx` | DONE | Custom ConnectButton |
| `components/sidebar.tsx` | DONE | Collapsible nav (64px/256px) |
| `components/smooth-scroll.tsx` | DONE | Lenis only active on landing |

---

## Hackathon Enhancement Checklist

### Must Have (Current)
- [x] x402 pay-per-request payments
- [x] ERC-8004 on-chain reputation
- [x] Multiple service agents
- [x] PayAgent with spend rules
- [x] Wallet connection (RainbowKit)
- [x] Avalanche C-Chain integration

### Should Add (Enhancement)
- [ ] **Add 3+ more service agents** (SQL, Regex, Explainer)
- [ ] **Smart Escrow Agent** — hold payment until conditions met
- [ ] **Routing Agent** — compare services by price/reputation
- [ ] **Agent-to-Agent composition** — demo agents calling each other
- [ ] **Enhanced reputation display** — show reputation tier badges

### Nice to Have
- [ ] Cross-chain demo (ICM)
- [ ] Video demo recording
- [ ] Live demo with testnet funds

---

## Architecture

```
User/Browser
  │
  ├── Landing (/)                    → Full-viewport sections, smooth scroll
  ├── Marketplace (/marketplace)      → Agent listing, search, filters
  ├── Dashboard (/dashboard)          → Collapsible sidebar, stats, rules
  │
  └── Connected via x402:
      │
      ├── Service Agents (pay per request)
      │   ├── Code Review (0.05 USDC)
      │   ├── Summarizer (0.02 USDC)
      │   ├── Translator (0.03 USDC)
      │   ├── SQL Generator (0.04 USDC) ← NEW
      │   ├── Regex Generator (0.03 USDC) ← NEW
      │   └── Code Explainer (0.02 USDC) ← NEW
      │
      ├── Smart Escrow Agent ← NEW
      │   └── Holds payment until task completed
      │
      ├── Routing Agent ← NEW
      │   └── Compares & selects best service
      │
      └── PayAgent (auto-payments)
          ├── Spend rules (subscription, tip, donation, conditional)
          ├── Spend limits (daily, weekly, monthly, per-tx)
          └── Cron endpoint (/api/cron/scheduler)

All payments settle on Avalanche Fuji (Chain 43113) as USDC transfers.
Every successful tx updates ERC-8004 reputation on-chain.
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Fonts | Geist Sans, Geist Mono, Instrument Serif |
| Icons | Lucide React |
| Animation | Framer Motion |
| Smooth Scroll | Lenis (landing page only) |
| Blockchain | Avalanche C-Chain Fuji Testnet (43113) |
| Web3 | ethers.js v6, viem, wagmi, RainbowKit |
| Smart Contract | Solidity ^0.8.20 |
| AI | OpenAI SDK (OpenRouter / GLM fallback) |
| Database | PostgreSQL via Prisma v5 |
| Deployment | Vercel |

---

## Live URLs

- **Production:** https://vaxa.vercel.app
- **Dashboard:** https://vaxa.vercel.app/dashboard
- **Marketplace:** https://vaxa.vercel.app/marketplace

---

## Environment Variables

```bash
# Avalanche
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_CHAIN_ID=43113
AGENT_REGISTRY_CONTRACT=0x...

# Wallets
PAY_AGENT_PRIVATE_KEY=0x...
DEPLOYER_PRIVATE_KEY=0x...

# USDC Testnet (Fuji)
USDC_CONTRACT_ADDRESS=0x5425890C6C9Fc8561a8b4E763b7E6e43b7e9A5F4

# AI
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-...
GLM_API_KEY=...

# Database
DATABASE_URL=postgresql://...

# Agent Addresses
CODE_REVIEW_AGENT_ADDRESS=0x...
SUMMARIZER_AGENT_ADDRESS=0x...
TRANSLATOR_AGENT_ADDRESS=0x...

# App
NEXTAUTH_SECRET=<random>
NEXT_PUBLIC_APP_URL=https://vaxa.vercel.app
WALLETCONNECT_PROJECT_ID=...
```

---

## Next Steps

1. **Add more service agents** — SQL Generator, Regex Generator, Code Explainer
2. **Implement Smart Escrow** — Payment held until verification
3. **Implement Routing Agent** — Auto-select best service
4. **Demo A2A** — Show agents calling each other
5. **Deploy & Test** — Full end-to-end x402 flow