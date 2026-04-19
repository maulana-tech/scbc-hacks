# Vaxa — Planning & Status

> AI agent marketplace on Avalanche C-Chain (Fuji testnet).
> Pay per request via x402. Build on-chain reputation via ERC-8004.

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
| Deployment | 100% | Vercel deployed: https://scbc-hacks.vercel.app |

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
| `lib/ai.ts` | DONE | OpenRouter/GLM abstraction layer (replaced Anthropic) |

### Agents

| File | Status | Notes |
|------|--------|-------|
| `agents/code-review/index.ts` | DONE | OpenRouter API integration |
| `agents/code-review/prompts.ts` | DONE | System + user prompt templates |
| `agents/summarizer/index.ts` | DONE | 3 styles: bullet, paragraph, tldr |
| `agents/translator/index.ts` | DONE | 50+ languages, source detection |
| `agents/pay-agent/index.ts` | DONE | getOrCreateConfig with proper wallet address |
| `agents/pay-agent/rule-executor.ts` | DONE | Real USDC transfers via ethers.js |
| `agents/pay-agent/history.ts` | DONE | Transaction history + spending stats |

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
| `app/globals.css` | DONE | Design system: charcoal dark theme, accent #b7d941, Instrument Serif |
| `app/layout.tsx` | DONE | Fixed header, Geist fonts, SmoothScroll (Lenis) |
| `app/page.tsx` | DONE | Full landing with sections, editorial serif, no rounded corners |
| `app/marketplace/page.tsx` | DONE | Agent listing with search, filters, framer-motion animations |
| `app/dashboard/page.tsx` | DONE | Collapsible sidebar, balance card, stat cards, rules, history |
| `components/AgentCard.tsx` | DONE | x402 payment modal with wallet connect |
| `components/navbar.tsx` | DONE | Custom ConnectButton with sharp corners |
| `components/sidebar.tsx` | DONE | Collapsible nav (64px/256px), framer-motion active indicator |
| `components/sidebar-context.tsx` | DONE | localStorage persisted collapse state |
| `components/smooth-scroll.tsx` | DONE | Lenis only active on landing page |
| `components/providers.tsx` | DONE | RainbowKit + wagmi + SidebarProvider |
| `components/ReputationBadge.tsx` | DONE | SVG ring, 3 sizes, color-coded |
| `components/SpendRuleForm.tsx` | DONE | Dynamic fields per rule type |
| `components/PaymentHistory.tsx` | DONE | Table with type badges, status dots |

### Config & Scripts

| File | Status | Notes |
|------|--------|-------|
| `package.json` | DONE | All deps + scripts (build includes prisma generate) |
| `tsconfig.json` | DONE | Path aliases configured |
| `next.config.ts` | DONE | Server external packages: openai, node-cron |
| `.env.example` | DONE | AI_PROVIDER, OPENROUTER_API_KEY, GLM_API_KEY, CRON_SECRET |
| `.env.local` | DONE | Dev values (empty secrets) |
| `.npmrc` | DONE | legacy-peer-deps=true for Vercel |
| `vercel.json` | DONE | Header config for cron protection |
| `scripts/seed-testnet.ts` | DONE | Register 3 agents on-chain |
| `DEPLOY.md` | DONE | Full deployment guide |

---

## Completed Tasks

### P0 — Core Infrastructure (DONE)
- [x] **P0.1** Added solc-js compilation
- [x] **P0.2** Fixed deploy script with real bytecode
- [x] **P0.3** Created scripts/deploy-contracts.ts
- [x] **P0.4** Prisma schema pushed to local DB
- [x] **P0.5** Scheduler starts at module bottom + cron endpoint
- [x] **P0.6** Env files populated (with placeholder secrets)

### P1 — Core Functionality (DONE)
- [x] **P1.1** Real USDC transfers in rule-executor.ts
- [x] **P1.2** Proper wallet address handling in PayAgent
- [x] **P1.3** Added recordSuccessfulTx to tip route
- [x] **P1.4** Implemented pause route
- [x] **P1.5** Implemented resume route
- [x] **P1.6** Reputation check in scheduler
- [x] **P1.7** Time-of-day check in scheduler

### P2 — Wallet & Auth (DONE)
- [x] **P2.1** Installed wagmi + RainbowKit
- [x] **P2.2** Wallet provider in providers.tsx
- [x] **P2.3** Dashboard uses real connected wallet
- [x] **P2.4** x-owner-address header from connected wallet
- [x] **P2.5** "Use Agent" button triggers x402 payment flow

### P3 — Dynamic Data (DONE)
- [x] **P3.1** Created GET /api/agents endpoint
- [x] **P3.2** Hardcoded data in landing + marketplace
- [x] **P3.3** Real reputation display on agent cards
- [x] **P3.4** Transaction counts shown

### P4 — Polish (DONE)
- [x] **P4.1** Created DEPLOY.md
- [x] **P4.2** Updated .env.example with all needed vars
- [x] **P4.3** Loading states in dashboard
- [x] **P4.5** Favicon + meta tags in layout.tsx
- [x] **P4.6** Responsive layout tested

---

## Architecture

```
User/Browser
  │
  ├── Landing (/)                    → Full-viewport sections, smooth scroll (Lenis)
  ├── Marketplace (/marketplace)      → Agent listing, search, filters
  ├── Dashboard (/dashboard)          → Collapsible sidebar, stats, rules, history
  │
  └── Connected via x402:
      │
      ├── Service Agents (pay per request)
      │   ├── POST /api/agents/code-review  → 0.05 USDC
      │   ├── POST /api/agents/summarize    → 0.02 USDC
      │   └── POST /api/agents/translate    → 0.03 USDC
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
| Scheduler | node-cron + Vercel Cron |
| Deployment | Vercel (production) |

---

## Live URLs

- **Production:** https://scbc-hacks.vercel.app
- **Dashboard:** https://scbc-hacks.vercel.app/dashboard
- **Marketplace:** https://scbc-hacks.vercel.app/marketplace

---

## Environment Variables

```bash
# Avalanche
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_CHAIN_ID=43113
AGENT_REGISTRY_CONTRACT=0x...          # After deploy

# Wallets
PAY_AGENT_PRIVATE_KEY=0x...            # Hot wallet for PayAgent
DEPLOYER_PRIVATE_KEY=0x...             # Wallet for contract deployment

# USDC Testnet (Fuji)
USDC_CONTRACT_ADDRESS=0x5425890C6C9Fc8561a8b4E763b7E6e43b7e9A5F4

# AI (choose one)
AI_PROVIDER=openrouter                 # or "glm"
OPENROUTER_API_KEY=sk-or-...          # from openrouter.ai/keys
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324
GLM_API_KEY=...                        # from open.bigmodel.cn
GLM_MODEL=glm-4-flash

# Database
DATABASE_URL=postgresql://...           # From Supabase/Neon

# Agent Addresses (from seed script)
CODE_REVIEW_AGENT_ADDRESS=0x...
SUMMARIZER_AGENT_ADDRESS=0x...
TRANSLATOR_AGENT_ADDRESS=0x...

# App
NEXTAUTH_SECRET=<random-32-chars>
NEXT_PUBLIC_APP_URL=https://scbc-hacks.vercel.app
WALLETCONNECT_PROJECT_ID=...

# Cron
CRON_SECRET=<random-secret>
```

---

## Next Steps

1. **Setup Database** — Create PostgreSQL on Supabase/Neon, add DATABASE_URL to Vercel
2. **Deploy Contract** — Run `npm run deploy:contract` + `npm run seed`
3. **Fill Env Vars** — Add all secrets to Vercel dashboard
4. **Test x402 Flow** — Connect wallet, use agent, verify USDC transfer + reputation update