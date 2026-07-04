# Submission Draft - Casper Agent Commerce Firewall

Status: Draft  
Public project name: AgentSafe Casper

## One-Line Pitch

Safe spending controls and on-chain receipts for AI agents on Casper.

## Short Description

AgentSafe Casper lets autonomous AI agents pay for tools and services only within user-defined rules. The demo shows an agent buying an RWA risk report, recording the approved action on Casper Testnet, and getting blocked when it tries to overspend.

## Long Description

AI agents are becoming capable of calling paid APIs, managing assets, and executing on-chain actions. That creates a trust problem: users and teams need to define what an agent is allowed to do, how much it can spend, which services it can access, and what public proof exists after an action.

AgentSafe Casper is a policy firewall for autonomous agent commerce. Users create an agent policy, route actions through an MCP-compatible gateway, and let a deterministic policy engine decide whether the action is allowed, blocked, or requires approval. Approved actions produce Casper Testnet transactions and on-chain receipts. Blocked actions stop before signing.

The MVP focuses on a simple RWA-flavored workflow: an agent buys a demo risk/compliance report within budget, writes a Casper receipt, then gets blocked when it tries to exceed the policy.

## Casper Integration

- Casper Testnet deployment.
- Transaction-producing smart contracts.
- Agent registry.
- Policy vault.
- Service registry.
- Receipt ledger.
- Explorer/CSPR.cloud proof links.
- Odra smart-contract development path.
- MCP-compatible Casper agent tools.
- x402-compatible service/payment adapter if Casper-native x402 docs are available in time.

## AI / Agentic Integration

The LLM is used for planning and tool selection. It can propose an action, call MCP tools, and summarize proof.

The LLM cannot sign transactions or override policy. Every action must pass a deterministic policy engine before execution.

## Demo Flow

1. Connect Casper wallet.
2. Create agent policy.
3. Ask agent to buy one RWA risk report.
4. Policy allows the action.
5. Casper transaction writes receipt.
6. Dashboard shows transaction proof.
7. Ask agent to buy ten reports.
8. Policy blocks the overspend.

## Why It Matters

Autonomous agents need more than wallets. They need rules, receipts, and revocation. Casper is well-suited to become the trust layer for this agent economy because smart contracts can commit policies and receipts while CSPR tooling gives agents and developers a practical interaction layer.

## Technical Proof Table

| Evidence | Link |
|---|---|
| Live app | TBD |
| Demo video | TBD |
| GitHub repo | TBD |
| ReceiptLedger package | `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833` |
| ReceiptLedger deploy tx | https://testnet.cspr.live/transaction/cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411 |
| Receipt write tx | https://testnet.cspr.live/transaction/3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86 |
| Test output | TBD |

## README Opening Draft

```md
# AgentSafe Casper

Safe spending controls and on-chain receipts for AI agents on Casper.

AgentSafe Casper lets users create autonomous AI agents that can call paid services only within explicit policies. The demo shows an agent buying an RWA risk report, recording the approved action on Casper Testnet, and getting blocked when it tries to overspend.

## Demo

- Live app: TBD
- Demo video: TBD
- Casper Testnet proof: ReceiptLedger deployed and receipt write executed

## Why

AI agents are starting to spend money and interact with smart contracts. Without policy controls, receipts, and revocation, users cannot safely delegate real economic actions.

AgentSafe Casper turns Casper into the trust layer for agent commerce: policies define what agents can do, smart contracts record commitments and receipts, and the MCP gateway gives agents a safe interface for action.
```

## Long-Term Launch Plan

Qualification MVP:

- Testnet smart contracts.
- Agent policy dashboard.
- MCP-compatible gateway.
- RWA demo service.
- Receipt proof.

Final round:

- Stronger x402 integration.
- CSPR.cloud streaming proof.
- Better policy templates.
- Hosted MCP gateway docs.
- Public landing page and socials.

Post-buildathon:

- Open-source Casper agent policy SDK.
- Agent service marketplace.
- DAO treasury mode.
- RWA oracle/compliance providers.
- Enterprise audit exports.
