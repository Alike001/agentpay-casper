# PRD - AgentPay Casper

Status: Current product cut  
Build phase: Qualification prototype live  
Target network: Casper Testnet  
Hackathon: Casper Agentic Buildathon 2026 - Qualification Round

## Goal

Build a Casper-native agent checkout prototype where API sellers can expose paid services to AI agents, buyer agents can request those services through MCP-compatible tools, AgentPay enforces spending policy before payment, and approved purchases are tied to Casper Testnet receipt proof.

## One-Line Pitch

AI-agent API payments on Casper, with policy controls and on-chain receipts.

## Target Users

- API and data providers that want to monetize services for AI agents.
- Developers building autonomous agents that need to buy paid APIs, RWA data, or DeFi intelligence.
- Teams experimenting with agent wallets but needing spending limits, receipts, and audit logs.
- Casper ecosystem builders looking for reusable x402, MCP, Odra, and receipt patterns.

## Problem

AI agents are becoming economic actors. They can call APIs, buy data, and trigger transactions, but current agent-wallet flows do not give sellers a clean payment interface or buyers a reliable policy layer. Agent commerce needs checkout infrastructure: payment required, policy approval, receipt proof, and blocked unsafe requests.

## Solution

AgentPay Casper provides:

- Merchant API console for a paid RWA Risk Report endpoint.
- Buyer agent policy console with per-request cap, daily budget, allowlist, and approval threshold.
- MCP-compatible gateway exposing safe paid-service tools.
- x402-style request/payment/policy/receipt flow.
- Deterministic policy engine that allows, blocks, or escalates agent purchases.
- Casper Testnet `ReceiptLedger` proof for approved purchases.

## Casper-Native Fit

The project is weak if Casper is removed. Casper provides:

- Odra smart-contract development.
- Testnet transaction proof.
- Receipt commitments for approved agent purchases.
- Future on-chain agent, policy, and merchant registries.
- Alignment with Casper AI Toolkit priorities: x402 micropayments, MCP blockchain access, CSPR.cloud reads/streams, CSPR.click signing, and verifiable AI outputs.

## Core User Journey

1. Merchant publishes `RWA Risk Report API` priced at `10 CSPR/request`.
2. Buyer agent requests `GET /rwa-risk-report`.
3. Merchant returns `402 Payment Required`.
4. AgentPay routes the proposed purchase through MCP-compatible tools.
5. Policy engine checks service allowlist, per-request cap, daily budget, approval threshold, expiry, revocation, and idempotency.
6. If allowed, the purchase is recorded in the console and tied to Casper Testnet receipt proof.
7. If over budget, AgentPay blocks before signing/payment.

## Demo Moment

- Allowed: buyer agent pays for a `10 CSPR` RWA API call and Casper receipt proof is visible.
- Blocked: buyer agent attempts a `100 CSPR` API call and AgentPay blocks it before payment.

Frame for judges:

> AgentPay is checkout infrastructure for AI agents on Casper.

Frame for community:

> Let AI agents pay APIs safely on Casper.

## MVP Scope

In scope:

- Merchant API card for a paid RWA endpoint.
- Buyer agent policy and budget controls.
- MCP-compatible tool surface.
- Deterministic policy engine.
- x402-style payment flow.
- Odra `ReceiptLedger` contract on Casper Testnet.
- Explorer proof links.
- README, demo script, submission copy, and limitations.

Out of scope for qualification:

- Mainnet funds.
- Custodial private keys.
- Full production x402 settlement.
- CSPR.click wallet signing.
- CSPR.cloud live streaming.
- On-chain AgentRegistry, PolicyVault, and ServiceRegistry.
- Security audit claims.

## Success Metrics

- Judge understands product in 30 seconds.
- Live app and console are publicly accessible.
- Casper Testnet receipt proof is visible without asking the team.
- Allowed and blocked agent payment flows work in under 90 seconds.
- README clearly states current proof, limitations, and final-round roadmap.
- Tests cover policy, MCP tools, and payment-flow state.

## Risks

| Risk | Impact | Mitigation |
|---|---:|---|
| Product still looks like a demo | High | Lead with merchant API, buyer agent, payment flow, and proof |
| Full x402 integration takes too long | Medium | Ship x402-style flow now; keep production settlement as final-round scope |
| Judges expect deeper on-chain policy | Medium | Be honest: ReceiptLedger is deployed now; registries/vaults are next |
| Wallet/Testnet friction | High | Use recorded explorer proof and local session flow for the video |
| AI usage appears thin | Medium | Make MCP/tool trace visible and explain model-as-intent, policy-as-authority |
