# Casper Testnet Deploy Attempts

## 2026-07-04 - ReceiptLedger Odra Deploy

Account:

- Public key: `018340478632514f55a9961133bd8c7bd1c2c17babd79cc55c54058ffa5a02a4c5`
- Account hash: `account-hash-1faa97913d2aab536a286e90c7ed9eac494d7350513a337f76eb5fa0c1d755d1`
- Confirmed balance before deploy work: `4,900 CSPR`

Reachable RPC:

- `https://node.testnet.casper.network/rpc`

Attempted deploy:

- Contract: `ReceiptLedger`
- WASM: `contracts/agent-safe-odra/wasm/ReceiptLedger.wasm`
- Payment amount: `500_000_000_000` motes
- Transaction hash: `4b041358bf524df0bd5931eee628981235711ac0585e47842a396665fa3ae648`
- Explorer: https://testnet.cspr.live/transaction/4b041358bf524df0bd5931eee628981235711ac0585e47842a396665fa3ae648

Result:

```text
Wasm preprocessing error: Deserialization error: Bulk memory operations are not supported
```

Diagnosis:

- Odra generated valid WASM, but optimization failed because `wasm-opt` was not installed.
- The unoptimized WASM contains `memory.copy` bulk-memory instructions.
- Casper Testnet rejected that WASM feature set.

Fix applied:

```bash
rustup toolchain install nightly-2025-02-17
rustup target add wasm32-unknown-unknown --toolchain nightly-2025-02-17
cargo +nightly-2025-02-17 build --target wasm32-unknown-unknown --bin agent_safe_odra_build_contract --release
cp target/wasm32-unknown-unknown/release/agent_safe_odra_build_contract.wasm wasm/ReceiptLedger.wasm
wasm-opt --signext-lowering -Oz wasm/ReceiptLedger.wasm -o wasm/ReceiptLedger.wasm
wasm-strip wasm/ReceiptLedger.wasm
```

Successful deploy:

- Contract: `ReceiptLedger`
- Package hash: `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833`
- Deploy transaction hash: `cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411`
- Explorer: https://testnet.cspr.live/transaction/cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411

Receipt write:

- Entry point: `write_receipt`
- Agent ID: `agentsafe-demo-agent`
- Service ID: `rwa-risk-report-api`
- Amount: `12500000000`
- Transaction hash: `3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86`
- Explorer: https://testnet.cspr.live/transaction/3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86

State readback:

```bash
receipt_count: 1
last_receipt_id: receipt-latest
last_agent_id: agentsafe-demo-agent
last_amount: 12500000000
```
