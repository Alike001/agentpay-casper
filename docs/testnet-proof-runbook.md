# Casper Testnet Proof Runbook

Status: deployed proof available  
Purpose: produce the evidence required by the qualification round.

## Current Proof

The prototype has deterministic policy logic, MCP-compatible tools, dashboard proof surfaces, and a deployed Odra `ReceiptLedger` contract on Casper Testnet.

Successful proof:

- ReceiptLedger package hash: `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833`
- Deploy transaction: https://testnet.cspr.live/transaction/cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411
- Receipt write transaction: https://testnet.cspr.live/transaction/3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86
- State readback: receipt count `1`, last receipt ID `receipt-latest`, last agent ID `agentsafe-demo-agent`, last amount `12500000000`.

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
- The CLI deployment account is funded on Casper Testnet.
- The first deploy attempt reached Testnet but failed because the WASM used unsupported bulk-memory operations.
- The successful deploy used `nightly-2025-02-17` to build WASM without bulk-memory, then `wasm-opt --signext-lowering` and `wasm-strip`.

Install Binaryen locally if needed:

```bash
sudo apt-get update
sudo apt-get install -y binaryen
```

## Local Demo Proof

```bash
npm run proof:demo
```

This writes `proof/demo-proof.json`, which demonstrates the local allow/block/receipt behavior. The public Testnet evidence is stored in `proof/testnet-proof.json`.

## Testnet Proof Requirements

For submission, `proof/testnet-proof.json` contains:

- ReceiptLedger package/contract hash.
- Receipt write deploy/transaction hash.
- Explorer or CSPR.cloud URLs.
- State readback values.

AgentRegistry, PolicyVault, and ServiceRegistry are final-round roadmap contracts.

## Deployment Options

### Preferred: Odra Contracts

Use Odra for smart contracts if setup completes quickly.

1. Install Odra prerequisites and Binaryen.
2. Build with `nightly-2025-02-17` to avoid Casper-unsupported bulk-memory operations.
3. Run Odra tests with `npm run contracts:odra:test`.
4. Copy the built WASM to `contracts/agent-safe-odra/wasm/ReceiptLedger.wasm`.
5. Run `wasm-opt --signext-lowering -Oz` and `wasm-strip`.
6. Deploy to Casper Testnet.
7. Record hashes in `proof/testnet-proof.json`.

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
