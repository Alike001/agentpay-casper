# Casper Testnet Proof Runbook

Status: ready for deployment credentials/tooling  
Purpose: produce the evidence required by the qualification round.

## Current Gap

The prototype has deterministic policy logic, MCP-compatible tools, dashboard proof surfaces, and a Rust contract-logic scaffold. It does **not** yet have real Casper Testnet contract addresses or transaction hashes.

## Readiness Command

```bash
npm run proof:readiness
```

This checks:

- Rust compiler.
- Cargo.
- optional `cargo-odra`.
- optional `wasm32-unknown-unknown` target.
- proof template files.

Odra docs list the required setup as:

```bash
rustup target add wasm32-unknown-unknown
cargo install cargo-odra --locked
```

Current local status:

- `wasm32-unknown-unknown` is installed.
- `cargo-odra` is installed.
- `contracts/agent-safe-odra` contains a tested Odra `ReceiptLedger` module.

## Local Demo Proof

```bash
npm run proof:demo
```

This writes `proof/demo-proof.json`, which demonstrates the local allow/block/receipt behavior. It is not sufficient for DoraHacks by itself. It is a placeholder until Testnet proof is created.

## Testnet Proof Requirements

For submission, fill `proof/testnet-proof.template.json` or create `proof/testnet-proof.json` with:

- AgentRegistry package/contract hash.
- PolicyVault package/contract hash.
- ServiceRegistry package/contract hash.
- ReceiptLedger package/contract hash.
- Agent registration deploy/transaction hash.
- Policy set deploy/transaction hash.
- Service registration deploy/transaction hash.
- Receipt write deploy/transaction hash.
- Explorer or CSPR.cloud URLs.

## Deployment Options

### Preferred: Odra Contracts

Use Odra for smart contracts if setup completes quickly.

1. Install Odra prerequisites.
2. Extend `contracts/agent-safe-odra` beyond `ReceiptLedger` if time allows.
3. Run Odra tests with `npm run contracts:odra:test`.
4. Build/deploy to Casper Testnet.
5. Record hashes in `proof/testnet-proof.json`.

### Fallback: Transaction-Producing Testnet Component

If Odra setup risks the qualification deadline, submit a smaller transaction-producing Casper component first, then continue smart-contract deployment for the final round.

Fallback must still be honest:

- README should say the contract suite is in progress.
- Demo video should show the transaction proof.
- Submission should not claim deployed smart contracts until hashes exist.

## Evidence Discipline

Do not paste screenshots alone. Every proof row needs:

- human-readable label
- hash
- explorer/CSPR.cloud URL
- date/time
- what action it proves
