## Goal

Build AgentSafe Casper: a working qualification prototype that demonstrates a policy-controlled AI agent commerce flow for Casper. The app must show an agent buying one RWA risk report inside policy, writing a receipt-shaped proof object, and blocking an over-budget action before execution.

## Constraints

Use a dependency-light implementation first: Node.js built-ins for API/tests, static HTML/CSS/JS for the dashboard, and a Rust contract-logic scaffold that can evolve into Odra/Casper Testnet contracts. Do not use mainnet funds, custodial private keys, or claim deployed Testnet proof until real addresses and transaction hashes exist. UI anchor: Trigger.dev/BetterStack-style operational dashboard with dense status/proof surfaces, not a marketing landing page.

## Acceptance

`npm run green-light` passes; dashboard runs with `npm run dev`; policy tests cover allowed, blocked, revoked, expired, duplicate, and approval-required actions; API exposes `/api/state`, `/api/simulate`, `/api/run-demo`, and `/mcp`; README/submission proof placeholders remain honest until Casper Testnet deployment is completed.
