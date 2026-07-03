# PRD - Casper Agent Commerce Firewall

Status: Draft for approval  
Build phase: Not started  
Target network: Casper Testnet  
Hackathon: Casper Agentic Buildathon 2026 - Qualification Round

## Goal

Build a demoable Casper Testnet application that lets a user create an AI agent spending policy, route agent tool calls through an MCP gateway, execute only allowed Casper actions, and record auditable on-chain receipts.

## One-Line Pitch

Policy-controlled AI agent payments and tool calls on Casper, with on-chain receipts and revocation.

## Target Users

- Developers building autonomous agents that need to call paid tools or transact.
- Teams experimenting with agent wallets but needing spending limits and audit logs.
- Casper ecosystem builders looking for reusable MCP, wallet, and smart-contract examples.

## Problem

AI agents are beginning to spend money, call APIs, and execute transactions. The missing production layer is not just wallet access. It is bounded authority: who allowed the agent to act, how much it can spend, which services it can call, when approval is required, and what receipt proves the action happened.

Current agent-wallet products usually optimize for fast transaction execution. They rarely give a protocol-native, open-source policy and receipt layer that Casper builders can reuse.

## Solution

Casper Agent Commerce Firewall provides:

- A wallet-connected dashboard for creating agent policies.
- Casper Testnet smart contracts for agent registration, service registration, policy state, and receipts.
- An MCP server exposing safe Casper tools to AI agents.
- A deterministic policy engine that allows, blocks, or escalates agent actions.
- A live proof timeline powered by Casper transaction hashes, contract events, and indexed reads.

## Sponsor-Native Fit

The project should be considered weak if Casper is removed. Casper is the trust layer for:

- Agent identity and revocation.
- Spend policy commitments.
- Service registry references.
- Receipt and audit events.
- Public transaction proof on Testnet.

Relevant ecosystem primitives:

- Casper smart contracts and Testnet.
- Odra for Rust contract development and tests.
- CSPR.click or Casper Wallet for user signing.
- CSPR.cloud for indexed reads and live stream proof.
- MCP for agent tool access.
- x402 as an optional paid HTTP/API adapter if sponsor docs confirm it is valued.

Official hackathon fit:

- The page explicitly requires a working prototype on Casper Testnet with a transaction-producing on-chain component.
- The page emphasizes Agentic AI, DeFi, RWA, MCP, x402, CSPR.click AI Agent Skill, CSPR.cloud APIs, Odra, and the Casper AI Toolkit.
- The page rewards long-term launch plans and Casper ecosystem impact, so the reusable MCP/contracts/API angle is strategically important.

## Core User Journey

1. User opens the dashboard and connects a Casper wallet.
2. User creates an agent profile.
3. User sets a policy:
   - max spend per action
   - allowed service ids
   - daily/test run budget
   - approval-required threshold
   - expiration/revocation status
4. User asks the agent to perform a paid tool action, ideally an x402-compatible or RWA-flavored demo service.
5. Agent routes through the MCP gateway.
6. Policy engine evaluates the proposed action.
7. If allowed, the app executes a Casper Testnet transaction and writes a receipt.
8. Dashboard shows the event, tx hash, receipt, and service result.
9. User asks for an over-budget action.
10. Policy engine blocks it and records the blocked attempt off-chain with an optional on-chain audit receipt.

## Demo Moment

The strongest moment is a split proof:

- Allowed: agent performs an action, Casper receipt appears live.
- Blocked: agent tries to overspend, policy blocks it before signing.

This makes the product immediately understandable: the project is the missing seatbelt for autonomous agent commerce.

For community voting, the demo should be framed as: **"Let AI agents spend safely on Casper."**

## MVP Scope

### In Scope

- Wallet connection.
- Agent registration contract.
- Policy contract.
- Service registry contract.
- Receipt ledger contract.
- One demo service callable through MCP.
- Deterministic policy engine.
- One agent workflow with allowed and blocked actions.
- Dashboard with proof timeline.
- Testnet deployment evidence.
- README, architecture diagram, demo script, and limitations.

### Out of Scope

- Mainnet funds.
- Custodial private keys.
- Fully decentralized service marketplace.
- Real enterprise compliance integrations.
- Autonomous trading/yield strategies.
- Security audit claims.

## Success Metrics

Hackathon success:

- At least one deployed Casper Testnet contract address.
- At least three real transaction hashes:
  - create agent
  - set/update policy
  - write receipt
- End-to-end demo works in under 90 seconds.
- README has live proof links and setup instructions.
- Tests cover allow, block, revoke, and receipt write paths.
- Project has CSPR.fans-ready copy, screenshots, and a short demo clip before voting opens.

Judge success:

- Judge can explain the product after 30 seconds.
- Judge can verify Casper usage without asking us.
- Judge can see AI acting through a bounded tool path.

## Acceptance Criteria

- User can connect wallet and create an agent.
- User can set a policy that is persisted on Casper Testnet.
- Agent can request one tool action through the MCP gateway.
- Policy engine blocks at least one unsafe action.
- Policy engine allows at least one safe action.
- Allowed action produces a Casper Testnet transaction and receipt.
- Dashboard displays transaction proof.
- Repo includes README, architecture, demo script, `.env.example`, and tests.

## Open Validation Items

- Verify exact DoraHacks submission URL and CSPR.fans voting process.
- Confirm final Casper AI Toolkit integration path and whether Casper Manifest affects submission scoring.
- Decide whether existing Casper MCP Server is integrated directly or referenced while we ship a project-specific MCP gateway.
- Verify Casper-native x402 implementation docs and ecosystem-credit requirements.
- Verify CSPR.click Testnet signing flow before committing to it as the primary wallet path.
- Verify CSPR.cloud API access keys/rate limits and Testnet event indexing behavior.

## Risks

| Risk | Impact | Mitigation |
|---|---:|---|
| Sponsor prefers simpler consumer apps | Medium | Demo as a concrete buyer-agent app, not only infra |
| Wallet/Testnet friction | High | Start with contract proof and backup explorer links |
| x402 integration consumes time | Medium | Keep x402 as P1 optional adapter |
| AI agent appears unsafe | High | No LLM custody; deterministic policy gate before signing |
| Too many contracts | High | Keep contracts simple: registry, policy, service, receipt |
