# Proof Folder

This folder stores evidence for the DoraHacks/CSPR.fans submission.

Current status:

- `demo-proof.json` can be generated locally with `npm run proof:demo`.
- `contracts/agent-safe-odra` contains a tested Odra `ReceiptLedger` module.
- `testnet-proof.json` contains the deployed Casper Testnet `ReceiptLedger` package hash and receipt-write transaction.
- `mandate-guard-testnet-proof.json` contains the final-round `MandateGuard` package installation and verified `create_mandate` transaction.
- Explorer links are included for the deploy and write transactions.

Current qualification evidence:

- ReceiptLedger contract/package hash.
- Receipt write transaction.
- State readback for receipt count, latest receipt ID, latest agent ID, and latest amount.

Final-round authority evidence:

- MandateGuard package installation transaction.
- A real `create_mandate` transaction with a bounded, expiring RWA procurement authority.

Final-round roadmap evidence:

- AgentRegistry contract/package hash.
- PolicyVault contract/package hash.
- ServiceRegistry contract/package hash.
