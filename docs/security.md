# Security Model - Casper Agent Commerce Firewall

Status: Draft  
Scope: Hackathon prototype, Casper Testnet only

## Core Security Claim

The project does not make the AI agent trusted. It makes agent actions **bounded, inspectable, and revocable**.

## Non-Negotiable Boundaries

- The LLM must not hold private keys.
- The LLM must not sign transactions.
- The LLM must not decide final allow/block authorization.
- The LLM must not update policies without wallet approval.
- The UI must not claim mainnet readiness or audit completion.

## Trust Model

Trusted:

- User wallet for signing.
- Casper Testnet for public state/receipt proof.
- Deterministic policy engine for authorization decisions.
- Smart contracts for policy/receipt commitments.

Partially trusted:

- Backend API for caching, UX, and orchestration.
- MCP gateway for structured tool exposure.
- CSPR.cloud for indexed reads and live stream convenience.

Untrusted:

- LLM output.
- User prompts.
- External service descriptions.
- Off-chain service results.

## Policy Enforcement

Every proposed agent action must be transformed into a structured object:

```json
{
  "agentId": "agent_123",
  "serviceId": "svc_456",
  "actionType": "paid_service_call",
  "amount": "0.10",
  "currency": "CSPR_TEST",
  "idempotencyKey": "run_action_hash",
  "requiresOnChainReceipt": true
}
```

The policy engine checks:

- agent is active
- policy is active
- policy is not expired
- service is allowed
- amount is within limit
- cumulative run/day budget is available
- approval exists if required
- idempotency key has not been used

## Reason Codes

All decisions must include a reason code:

- `ALLOWED`
- `AGENT_REVOKED`
- `POLICY_EXPIRED`
- `POLICY_DISABLED`
- `SERVICE_NOT_ALLOWED`
- `AMOUNT_OVER_LIMIT`
- `BUDGET_EXCEEDED`
- `APPROVAL_REQUIRED`
- `DUPLICATE_ACTION`
- `INVALID_SERVICE`

## On-Chain Receipts

Receipt fields should commit to facts without storing unnecessary sensitive data:

- agent id
- service id
- action hash
- result hash
- policy hash
- amount
- status
- timestamp/event metadata

Avoid storing raw prompts, private API responses, secrets, PII, or sensitive business data on-chain.

## Threats

| Threat | Mitigation |
|---|---|
| Prompt injection asks agent to overspend | Structured action + deterministic policy check |
| Agent tries unapproved service | Service allowlist |
| Revoked agent continues acting | Revocation check before execution |
| Replay attack | Idempotency key and action hash |
| Fake UI proof | Explorer/CSPR.cloud links |
| Sensitive data leakage | Hash commitments, no raw prompt/result on-chain |
| Backend bypass | Contract-level ownership checks for policy changes |

## Hackathon Disclosure

README must state:

- Prototype is Testnet-only.
- Contracts are unaudited.
- Not suitable for custody or mainnet funds.
- AI outputs are untrusted.
- x402 adapter, if present, is experimental.

