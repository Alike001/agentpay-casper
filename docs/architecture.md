# Architecture - Casper Agent Commerce Firewall

Status: Draft  
Architecture owner: pending implementation approval

## System Overview

Casper Agent Commerce Firewall has five layers:

1. **Web dashboard** for users to manage agents, policies, service access, and receipts.
2. **API backend** for app state, policy simulation, approvals, and chain indexing.
3. **MCP gateway** exposing safe tools to AI agents.
4. **AI orchestration** for planning and tool selection, never signing directly.
5. **Casper contracts** for policy commitments, agent/service registry state, and receipts.

```text
User Wallet
  -> Web Dashboard
  -> API Backend
  -> Policy Engine
  -> MCP Gateway
  -> AI Agent Tool Calls
  -> Casper Client
  -> Casper Testnet Contracts
  -> CSPR.cloud / Explorer Proof
  -> Dashboard Timeline
```

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Web | Next.js + TypeScript | Fast, demo-friendly, deployable |
| UI | Tailwind + shadcn/ui | Accessible components and fast polish |
| Wallet | CSPR.click first, Casper Wallet fallback | Best Casper UX if Testnet support validates |
| API | Fastify + TypeScript | Lightweight, typed, low ceremony |
| DB | Postgres + Prisma | Durable app/audit state |
| Cache/queue | Redis + BullMQ | Stream cursors and async chain status |
| MCP | TypeScript MCP SDK | Natural fit for agent tools |
| AI | Provider abstraction over tool-calling LLM | Avoid provider lock-in |
| Contracts | Rust + Odra | Casper-native contract DX |
| Chain reads | CSPR.cloud + explorer fallback | Indexed proof and live status |
| Tests | Vitest, Playwright, Odra/Rust tests | Unit, API, and e2e coverage |

## Smart Contracts

### AgentRegistry

Purpose: register agent identities controlled by a wallet.

State:

- `agent_id`
- `owner`
- `metadata_hash`
- `status`: active, revoked
- `created_at`

Entrypoints:

- `register_agent(metadata_hash)`
- `revoke_agent(agent_id)`
- `update_agent_metadata(agent_id, metadata_hash)`
- `get_agent(agent_id)`

Events:

- `AgentRegistered`
- `AgentRevoked`
- `AgentUpdated`

### PolicyVault

Purpose: store enforceable policy commitments for an agent.

State:

- `agent_id`
- `max_amount_per_action`
- `daily_budget`
- `allowed_service_ids`
- `approval_threshold`
- `expires_at`
- `policy_hash`
- `active`

Entrypoints:

- `set_policy(agent_id, policy_hash, constraints)`
- `disable_policy(agent_id)`
- `get_policy(agent_id)`

Events:

- `PolicySet`
- `PolicyDisabled`

### ServiceRegistry

Purpose: register services/tools that agents may call.

State:

- `service_id`
- `owner`
- `endpoint_hash`
- `pricing_hash`
- `metadata_hash`
- `active`

Entrypoints:

- `register_service(metadata_hash, endpoint_hash, pricing_hash)`
- `deactivate_service(service_id)`
- `get_service(service_id)`

Events:

- `ServiceRegistered`
- `ServiceDeactivated`

### ReceiptLedger

Purpose: write audit receipts for agent actions.

State:

- `receipt_id`
- `agent_id`
- `service_id`
- `amount`
- `action_hash`
- `result_hash`
- `policy_hash`
- `status`
- `created_at`

Entrypoints:

- `write_receipt(agent_id, service_id, action_hash, result_hash, amount, policy_hash, status)`
- `get_receipt(receipt_id)`

Events:

- `ReceiptWritten`

## Backend Services

### API

Responsibilities:

- Wallet session verification.
- Agent and policy cache.
- Approval request lifecycle.
- Policy simulation endpoint.
- Receipt and run history.
- Chain proof ingestion from CSPR.cloud.

Core routes:

- `POST /agents`
- `GET /agents/:id`
- `POST /agents/:id/policy/simulate`
- `POST /agents/:id/approvals`
- `GET /receipts`
- `GET /proof/:txHash`

### Policy Engine

The policy engine is deterministic and must not depend on LLM judgment.

Inputs:

- Agent id.
- Service id.
- Proposed amount.
- Action type.
- Policy constraints.
- Revocation status.
- Optional approval status.

Outputs:

- `allow`
- `block`
- `needs_approval`

Required checks:

- Agent active.
- Policy active and unexpired.
- Service allowed.
- Amount within limit.
- Daily/test-run budget available.
- Required approval present when threshold exceeded.
- Idempotency key not reused.

### MCP Gateway

Tools:

- `casper_get_agent_policy`
- `casper_list_services`
- `casper_quote_service`
- `casper_simulate_action`
- `casper_request_approval`
- `casper_execute_allowed_action`
- `casper_write_receipt`
- `casper_revoke_agent`

The gateway never signs directly. It prepares requests and passes signing work to the wallet/client path or a clearly scoped server-side Testnet-only demo signer if sponsor requirements allow it. Preferred MVP: user wallet signs protocol-critical writes.

## AI Architecture

The LLM is allowed to:

- Interpret the user request.
- Select a service.
- Produce a structured proposed action.
- Explain why an action was allowed or blocked.
- Summarize receipts.

The LLM is not allowed to:

- Hold private keys.
- Bypass the policy engine.
- Modify policies without wallet approval.
- Decide final allow/block alone.
- Invent transaction proof.

Prompt/tool pattern:

1. User asks agent to perform action.
2. LLM calls `casper_list_services`.
3. LLM calls `casper_quote_service`.
4. LLM proposes structured action.
5. Policy engine checks action.
6. If allowed, transaction path proceeds.
7. LLM summarizes final proof from actual receipt data.

## Data Model

Postgres tables:

- `users`
- `wallet_sessions`
- `agents`
- `policies`
- `services`
- `approvals`
- `agent_runs`
- `tool_calls`
- `receipts`
- `chain_events`
- `audit_logs`

On-chain data remains source-of-truth for active policy and receipt commitments. Postgres is a cache plus richer UX/audit layer.

## Security Model

Principles:

- No LLM custody.
- Wallet/user signs policy changes.
- Policy engine is deterministic.
- Contracts emit audit events.
- All demo receipts link to tx hashes.
- All irreversible or high-risk operations require explicit user approval.

Threats and mitigations:

| Threat | Mitigation |
|---|---|
| Prompt injection asks agent to overspend | Policy engine blocks over-budget action |
| Revoked agent keeps acting | Policy engine checks chain/cache status before execution |
| Duplicate receipt/action replay | Idempotency key and action hash |
| Fake proof in UI | UI links to explorer/CSPR.cloud proof |
| Service endpoint mutation | Store endpoint/pricing hashes in registry |

## Deployment Plan

Development:

- Local Next.js app.
- Local API/MCP server.
- Local Postgres/Redis through Docker.
- Casper Testnet contracts.

Production demo:

- Web: Vercel.
- API/MCP: Railway/Fly.io/Render.
- DB: Neon/Supabase.
- Redis: Upstash.
- Contracts: Casper Testnet.

## CI

Required checks:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- contract tests
- Playwright happy-path e2e

## Evidence Checklist

- Contract package hashes / addresses.
- Transaction hashes for agent registration, policy set, receipt write.
- Explorer links.
- CSPR.cloud event/API screenshots or links.
- Test output.
- Demo video.
- README proof table.

