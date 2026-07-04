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

Next fix:

```bash
sudo apt-get update
sudo apt-get install -y binaryen
```

Then rebuild:

```bash
cd /home/ali/Desktop/casper-agent-commerce-firewall/contracts/agent-safe-odra
cargo odra build
```

Expected result:

- `cargo odra build` should run `wasm-opt` and produce Casper-compatible optimized WASM.
- Retry deploy after optimized WASM exists.
