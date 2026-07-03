# Demo Script - Casper Agent Commerce Firewall

Status: Draft  
Target: 90-second judge demo plus 3-minute technical demo

## 90-Second Judge Demo

### Setup

Preload:

- Wallet connected or ready.
- Testnet balance available.
- One agent already registered or ready to create.
- One demo service registered.
- Explorer/CSPR.cloud proof tab open.

### Script

0:00-0:10

"AI agents can now call tools and spend money, but users and businesses need spending limits, approvals, revocation, and receipts. We built that control layer on Casper."

0:10-0:25

Show dashboard:

- Active agent.
- Spend cap.
- Allowed service.
- Policy status.

"This agent can use one approved service and cannot spend above the policy limit."

0:25-0:45

Run allowed prompt:

"Agent, buy one demo RWA risk report within my spending limit."

Show:

- Agent proposes action.
- MCP gateway checks policy.
- Policy returns `ALLOWED`.

0:45-1:05

Execute action:

- Wallet signs or demo transaction executes.
- Receipt is written to Casper Testnet.
- Timeline updates with transaction hash.

"The result is not just a chat answer. Casper records a receipt for what the agent did."

1:05-1:20

Run blocked prompt:

"Agent, buy ten RWA risk reports and exceed the limit."

Show:

- Policy returns `AMOUNT_OVER_LIMIT`.
- No transaction is signed.

1:20-1:30

Close:

"Casper becomes the auditable policy layer for autonomous agent commerce: agents can act, but only inside user-defined rules."

Community voting line:

"In plain English: we let AI agents spend safely on Casper."

## 3-Minute Technical Demo

### Segment 1 - Architecture

Show:

- Web dashboard.
- API/policy engine.
- MCP gateway.
- Casper contracts.
- CSPR.cloud/explorer proof.

Key line:

"The LLM plans, but deterministic policy decides. The LLM never holds keys and cannot bypass policy."

### Segment 2 - Contracts

Show contract proof table:

- AgentRegistry.
- PolicyVault.
- ServiceRegistry.
- ReceiptLedger.

Key line:

"Each critical state transition has Casper Testnet proof: agent registration, policy update, service registration, and receipt write."

### Segment 3 - MCP Tools

Show tools:

- `casper_get_agent_policy`
- `casper_list_services`
- `casper_quote_service`
- `casper_simulate_action`
- `casper_execute_allowed_action`
- `casper_write_receipt`
- `casper_revoke_agent`

Key line:

"This is reusable infrastructure. Any Casper agent can use the same MCP surface."

### Segment 4 - Safety

Show blocked action reason codes:

- `SERVICE_NOT_ALLOWED`
- `AMOUNT_OVER_LIMIT`
- `APPROVAL_REQUIRED`
- `AGENT_REVOKED`

Key line:

"We are not asking judges to trust the model. We are showing deterministic enforcement with public receipts."

### Segment 5 - Roadmap

Post-hackathon path:

- x402 paid API adapter.
- DAO treasury mode.
- RWA oracle/compliance report marketplace.
- Enterprise policy templates.
- Agent reputation registry.
- Hosted MCP gateway.

## Backup Demo Plan

If wallet signing fails:

- Use recorded video.
- Show Testnet transaction links.
- Show local policy engine allow/block logs.

If CSPR.cloud indexing lags:

- Show explorer links and backend logs.
- Explain that CSPR.cloud stream is used for live UX but explorer proof is sufficient.

If x402 is not ready:

- Demo Casper-native service registry and receipt path.
- Treat x402 as roadmap/adapter.
