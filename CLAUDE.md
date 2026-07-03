# AgentSafe Casper Working Notes

This repo is a dependency-light hackathon prototype for the Casper Agentic Buildathon 2026.

## Commands

- `npm run dev` starts the local API and dashboard at `http://localhost:4173`.
- `npm run green-light` runs lint, syntax checks, Node tests, Rust tests, and build validation.
- `npm run contracts:test` runs the Rust contract-logic scaffold tests.

## Rules

- Do not claim Casper Testnet deployment until contract addresses and transaction hashes exist.
- Keep the LLM out of signing and final authorization.
- Every policy decision needs a reason code.
- UI is operational dashboard first, not a landing page.
- Proof links belong in the README top half once real.

## Current Stack

- Node built-ins for API, static server, and tests.
- Static HTML/CSS/JS for the first demo UI.
- Rust scaffold for contract state and tests.
- Future path: Odra contracts, CSPR.click signing, CSPR.cloud proof, x402 adapter.
