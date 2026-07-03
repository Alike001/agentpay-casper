# Story 04 - End-to-End Demo

Goal: Complete one user prompt to agent action to Casper receipt workflow.

Constraints:

- Demo must work on Casper Testnet.
- Must produce real transaction hashes.
- Must be explainable in under 90 seconds.

Acceptance:

- User prompt triggers agent planning.
- Agent calls MCP gateway.
- Policy engine allows one action.
- Casper transaction executes.
- Receipt is written on-chain.
- Dashboard displays proof.
- A second over-budget prompt is blocked.

Demo script:

1. Connect wallet.
2. Show agent policy.
3. Ask agent to buy/use a demo paid data service.
4. Show policy decision.
5. Show Testnet receipt transaction.
6. Ask agent to exceed the limit.
7. Show deterministic block.

