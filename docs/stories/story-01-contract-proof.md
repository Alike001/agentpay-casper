# Story 01 - Contract Proof

Goal: Deploy minimal Casper Testnet contracts for agent, policy, service, and receipt proof.

Constraints:

- Use Odra if compatible with current Casper Testnet.
- Keep contract logic minimal and testable.
- No mainnet or real funds.

Acceptance:

- Contract tests pass.
- Contracts deploy to Casper Testnet.
- Proof log contains package hashes/addresses and tx hashes.
- Contract events or queryable state show:
  - agent registered
  - policy set
  - service registered
  - receipt written

Implementation notes:

- Start with data commitments and events, not complex escrow.
- Prefer simple ids and hashes over large dynamic metadata.
- Store rich metadata off-chain and commit hashes on-chain.

