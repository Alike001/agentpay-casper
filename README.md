# AgentSafe Casper

Safe spending controls and receipt proofs for AI agents on Casper.

AgentSafe Casper is a hackathon prototype for the Casper Agentic Buildathon 2026. It demonstrates an AI-agent commerce firewall: an agent can buy a demo RWA risk report only if the proposed action fits the user's policy, and an over-budget action is blocked before signing.

## Demo Routes

- Landing page: `npm run dev`, then open `http://localhost:4173`
- Working dashboard: `http://localhost:4173/dashboard`
- Live app: TBD
- Demo video: TBD
- Casper Testnet proof: deployed ReceiptLedger + receipt transaction

## What Works Now

- Separate landing page and operational dashboard.
- Node API for state, simulation, and demo runs.
- MCP-compatible JSON-RPC endpoint with policy and receipt tools.
- Deterministic policy engine with reason codes.
- Rust contract-logic scaffold and tests for agent, policy, service, and receipt state.
- Odra `ReceiptLedger` contract module with passing Odra test and Casper Testnet deployment.
- Proof readiness and local demo proof scripts.

## Casper Testnet Proof

The qualification prototype has a transaction-producing Casper Testnet component. `ReceiptLedger` records the approved agent action receipt for the RWA risk report demo.

| Evidence | Link |
|---|---|
| ReceiptLedger package | `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833` |
| ReceiptLedger deploy tx | https://testnet.cspr.live/transaction/cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411 |
| Receipt write tx | https://testnet.cspr.live/transaction/3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86 |
| Receipt count | `1` |
| Last receipt ID | `receipt-latest` |
| Last agent ID | `agentsafe-demo-agent` |

Odra readiness:

```bash
npm run contracts:odra:test
```

Current Testnet deployment status:

- CLI account is funded and deployed to `casper-test`.
- A first deploy attempt failed because Casper rejected bulk-memory WASM.
- The successful deploy used `nightly-2025-02-17` to build WASM without bulk-memory instructions, then `wasm-opt --signext-lowering` and `wasm-strip`.
- Public proof is stored in `proof/testnet-proof.json`.

## Quickstart

```bash
npm run green-light
npm run proof:demo
npm run dev
```

## Proof Workflow

```bash
npm run proof:readiness
npm run proof:demo
```

`proof/demo-proof.json` is local-only evidence. `proof/testnet-proof.json` contains the real Casper Testnet deployment and receipt transaction proof.

## API

- `GET /api/state`
- `POST /api/simulate`
- `POST /api/run-demo`
- `POST /mcp`

Example MCP-style request:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "casper_simulate_action",
    "arguments": {
      "agentId": "agent-rwa-001",
      "serviceId": "svc-rwa-risk",
      "amount": 10,
      "actionType": "rwa_report_purchase",
      "idempotencyKey": "demo-1"
    }
  }
}
```

## Security and Limitations

- Testnet/demo prototype only.
- ReceiptLedger is deployed on Casper Testnet; the broader AgentRegistry, PolicyVault, and ServiceRegistry contracts are roadmap/final-round scope.
- Contracts are unaudited.
- The LLM must not hold keys or sign transactions.
- Policy decisions are deterministic and must happen before execution.

## Structure

```text
apps/api/          Node API and static server
apps/mcp-server/   MCP-compatible tool surface
apps/web/          Static dashboard
contracts/         Rust contract-logic scaffold
packages/          Shared policy engine and types
tests/             Node test runner tests
docs/              Research, architecture, demo, and submission docs
```
