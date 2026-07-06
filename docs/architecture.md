# Architecture - AgentPay Casper

Status: Current qualification architecture

## System Overview

AgentPay Casper is a Casper-native agent checkout prototype with five layers:

1. **Landing page** explaining the product in under 30 seconds.
2. **Product console** showing merchant API, buyer agent policy, checkout trace, receipts, and Casper proof.
3. **Node API** serving app state, payment-flow runs, policy simulation, reset, static assets, and MCP-compatible requests.
4. **Policy engine** enforcing deterministic spend rules before agent payment.
5. **Casper proof layer** using an Odra `ReceiptLedger` contract deployed on Casper Testnet.

```text
Merchant API
  -> 402 Payment Required
  -> Buyer Agent Intent
  -> MCP-Compatible Gateway
  -> Deterministic Policy Engine
  -> Allowed / Blocked Decision
  -> Session Receipt
  -> Casper Testnet ReceiptLedger Proof
  -> Console Timeline + Explorer Link
```

## Current Stack

| Layer | Current Choice | Reason |
|---|---|---|
| Web | Static HTML/CSS/JS | Fast, deployable, low-risk before deadline |
| API | Node HTTP server | No framework dependency; simple Render deployment |
| Policy | Shared JavaScript package | Testable allow/block logic |
| MCP | JSON-RPC-compatible `/mcp` endpoint | Demonstrates agent tool access without heavy setup |
| Contracts | Rust + Odra | Casper-native smart-contract path |
| Proof | `ReceiptLedger` on Casper Testnet + CSPR.live links | Verifiable transaction-producing component |
| Deployment | Render Docker service | Public URL with health check |
| Tests | Node test runner + Rust/Odra tests | Covers policy, MCP, demo state, and contract logic |

## Current Smart Contract

### ReceiptLedger

Purpose: record the latest approved agent API purchase receipt.

State:

- `receipt_count`
- `last_receipt_id`
- `last_agent_id`
- `last_service_id`
- `last_action_hash`
- `last_result_hash`
- `last_policy_hash`
- `last_amount`

Entrypoints:

- `init`
- `write_receipt(agent_id, service_id, action_hash, result_hash, policy_hash, amount)`
- `receipt_count`
- `last_receipt_id`
- `last_agent_id`
- `last_amount`

Current deployed proof:

- Package hash: `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833`
- Deploy tx: `cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411`
- Receipt write tx: `3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86`

## API Surface

- `GET /healthz`
- `GET /api/state`
- `POST /api/simulate`
- `POST /api/run-demo`
- `POST /api/reset`
- `POST /mcp`
- `GET /`
- `GET /dashboard`

## MCP-Compatible Tools

- `casper_get_agent_policy`
- `casper_list_services`
- `casper_simulate_action`
- `casper_execute_allowed_action`
- `casper_write_receipt`

The gateway does not let the LLM sign, hold keys, or override policy. It exposes structured actions that are checked before execution.

## Policy Engine

Inputs:

- agent id
- service id
- action type
- amount
- idempotency key
- optional approval id

Checks:

- agent active
- policy active and unexpired
- service exists and is active
- service is allowlisted
- idempotency key is unused
- amount is under per-request cap
- daily budget is available
- approval exists when threshold is exceeded

Outputs:

- `allow`
- `block`
- `needs_approval`

Reason codes include `ALLOWED`, `AMOUNT_OVER_LIMIT`, `BUDGET_EXCEEDED`, `APPROVAL_REQUIRED`, `SERVICE_NOT_ALLOWED`, `DUPLICATE_ACTION`, and `AGENT_REVOKED`.

## Final-Round Architecture

The qualification build proves the core product path. Final-round expansion should add:

- Full Casper x402 adapter.
- CSPR.click wallet/signing flow.
- CSPR.cloud deploy/contract streaming.
- On-chain `AgentRegistry`.
- On-chain `PolicyVault`.
- On-chain `ServiceRegistry`.
- Merchant SDK for publishing paid APIs.
- Hosted MCP gateway docs.
- Persistent database for accounts, merchants, policies, and receipts.

## Security Model

- Testnet only.
- Contracts are unaudited.
- LLM output is untrusted.
- LLM never holds private keys.
- Policy decisions are deterministic.
- Raw prompts, PII, and private service results should not be written on-chain.
- Current console actions update session state; permanent proof is the recorded Casper Testnet deployment and receipt write.
