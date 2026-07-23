# Architecture - AgentPay Casper

Status: Final-round Testnet architecture

## System Overview

AgentPay Casper is a Casper-native spending-mandate product with five layers:

1. **Landing page** explaining the product in under 30 seconds.
2. **Mandate Workbench** for drafting, validating, evaluating, and wallet-signing agent authority.
3. **Node API** serving persistent mandates, deterministic evaluations, static assets, MCP tools, and unsigned Casper transaction construction.
4. **Policy engine** enforcing deterministic spend rules before an agent action.
5. **Casper authority layer** using deployed Odra `MandateGuard` and historical `ReceiptLedger` contracts on Casper Testnet.

```text
Human intent
  -> AI draft (optional)
  -> Deterministic Policy Engine
  -> Owner wallet review and signing
  -> Casper Testnet MandateGuard authority
  -> MCP agent action evaluation
  -> x402 settlement when configured
  -> Receipt evidence and Explorer Link
```

## Current Stack

| Layer | Current Choice | Reason |
|---|---|---|
| Web | Static HTML/CSS/JS | Fast, deployable, low-risk before deadline |
| API | Express | Persistent mandate API and simple Render deployment |
| Policy | Shared JavaScript package | Testable deterministic allow/block logic |
| MCP | Official MCP SDK Streamable HTTP endpoint at `/mcp` | Typed, structured agent tools without signing authority |
| Contracts | Rust + Odra | Casper-native smart-contract path |
| Proof | `MandateGuard` and `ReceiptLedger` on Casper Testnet + CSPR.live links | Verifiable authority plus receipt evidence |
| Deployment | Render Node service | Public URL with health check |
| Tests | Node test runner + Rust/Odra tests | Covers mandate, MCP, x402 adapter, policy, storage, and contract logic |

## Smart Contracts

### MandateGuard

Purpose: give an agent narrow, revocable, expiring authority without custody of the owner wallet.

Core entry points:

- `create_mandate`
- `add_allowed_service`
- `authorize_action`
- `record_settlement`
- `revoke_mandate`

The contract stores the owner, delegate, limits, daily budget, approval threshold, expiry, allowed services, action replay state, and settlement hashes. It is deployed on Casper Testnet and has a verified `create_mandate` transaction:

- Package hash: `hash-eb5d3394550f634cf6c5ad6629a9b75362aea1cc2957319ea92a3eeee41db222`
- Install tx: `751dd46fe662be6adc9fd862821667306e7d662c7db07114e47228d26e51164d`
- Mandate tx: `afe0c811796d1e2b4e779279ab762266b44c630eae7a21261787d0dc030dbdab`

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

## Remaining Integrations

- CSPR.click needs a registered production app ID for browser wallet signing.
- Casper x402 needs facilitator, payee, and WCSPR Testnet metadata for end-to-end settlement.
- CSPR.cloud needs an API key for indexed confirmation and receipt reads.

## Security Model

- Testnet only.
- Contracts are unaudited.
- LLM output is untrusted.
- LLM never holds private keys.
- Policy decisions are deterministic.
- Raw prompts, PII, and private service results should not be written on-chain.
- Mandate drafts and evaluations are persisted locally by the application. Only confirmed Casper Testnet transactions are represented as on-chain authority or proof.
