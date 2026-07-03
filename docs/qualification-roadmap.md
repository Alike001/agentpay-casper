# Qualification Roadmap - July 3 to July 7, 2026

Status: Pre-code execution plan  
Deadline: July 7, 2026  
Primary objective: qualify for the final round with a working Casper Testnet prototype and strong CSPR.fans community-voting assets.

## Strategy

The qualification round has two paths:

1. **Community Voting Path**: top 3 CSPR.fans projects advance directly.
2. **Builder Merit Path**: projects must meet technical eligibility: working prototype on Casper Testnet with a transaction-producing on-chain component.

We should optimize for both. The MVP must be real enough to satisfy technical eligibility, but the public story must be simple enough for community voters:

> Let AI agents spend safely on Casper.

## Scope Lock

### Must Ship by July 7

- Public GitHub repo.
- README with setup, architecture, proof, limitations, and demo instructions.
- Public demo video.
- Casper Testnet contract deployment.
- At least one transaction-producing on-chain component.
- Agent policy creation.
- MCP or MCP-compatible agent tool flow.
- One allowed agent action.
- One blocked overspend action.
- Dashboard showing policy, action, and transaction proof.
- CSPR.fans-ready project copy and screenshots.

### Cut If Time Slips

- Full x402 production payment flow.
- Multi-service marketplace.
- DAO mode.
- Real compliance provider integration.
- Mainnet-like custody flow.
- Complex escrow.
- Multi-agent swarm.

### Keep As Demo Simulation If Needed

- RWA risk/compliance report can be a demo service with deterministic output.
- x402 can be represented as an adapter interface if native docs or credits flow are unclear.
- CSPR.cloud streaming can fall back to polling/explorer links if indexing lags.

## Day Plan

### July 3 - Validation and Skeleton

Outcome: all blockers resolved enough to code.

Tasks:

- Verify DoraHacks URL and submission form.
- Verify CSPR.fans voting instructions.
- Verify Casper Testnet faucet/RPC/explorer.
- Verify CSPR.click/Casper Wallet signing path.
- Verify Odra contract workflow.
- Confirm final Casper AI Toolkit integration path from `https://www.casper.network/ai`.
- Decide existing Casper MCP Server vs project-specific MCP gateway layering.
- Decide final project name.
- Freeze MVP scope.
- Create repo skeleton after explicit implementation approval.

Exit criteria:

- Build stack confirmed.
- No unresolved dependency can block the core demo.
- Fallbacks are documented for CSPR.click, CSPR.cloud streaming, and x402.

### July 4 - Contract and Chain Proof

Outcome: Casper Testnet proof exists.

Tasks:

- Implement minimal contracts:
  - `AgentRegistry`
  - `PolicyVault`
  - `ServiceRegistry`
  - `ReceiptLedger`
- Add contract tests for register, policy set, receipt write, revoke/block state.
- Deploy to Casper Testnet.
- Record contract addresses/package hashes and transaction hashes.

Exit criteria:

- Testnet tx proof is real.
- README proof table can be partially filled.

### July 5 - App, MCP, and Policy Engine

Outcome: one end-to-end local demo works.

Tasks:

- Build dashboard shell.
- Add wallet connection or fallback signing path.
- Add policy editor.
- Build MCP-compatible gateway tools.
- Build deterministic policy engine.
- Connect allowed action path to receipt write.
- Connect blocked overspend path.

Exit criteria:

- User can trigger allowed and blocked agent actions.
- Allowed action writes Casper receipt.
- Blocked action does not sign or transact.

### July 6 - Polish, Proof, and Video

Outcome: qualification submission assets are ready.

Tasks:

- Polish dashboard.
- Add proof timeline with explorer links.
- Add CSPR.fans screenshots.
- Record 90-second demo.
- Record backup 3-minute technical walkthrough.
- Complete README.
- Complete architecture diagram.
- Add `.env.example`.
- Run tests and capture output.

Exit criteria:

- Demo works on a clean path.
- README top half has pitch, demo, and proof.
- Video is public or ready to publish.

### July 7 - Submit Early

Outcome: DoraHacks submission is complete before the deadline.

Tasks:

- Final smoke test.
- Confirm public repo visibility.
- Confirm video visibility.
- Confirm live app or recorded demo works in private/incognito.
- Submit to DoraHacks.
- Submit/activate CSPR.fans voting if separate.
- Publish community voting post.

Exit criteria:

- DoraHacks submission accepted.
- CSPR.fans vote page is live or instructions are followed.
- Backup submission text is stored locally.

## Final Round Preparation

If qualified, July 13-26 should expand from prototype to serious product:

- Replace demo service with stronger RWA/compliance or x402 service.
- Add better CSPR.cloud streaming.
- Add hosted MCP gateway docs.
- Add social/project landing page.
- Add security hardening.
- Add long-term launch plan and grant roadmap.
- Add more complete tests.
