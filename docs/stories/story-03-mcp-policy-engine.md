# Story 03 - MCP Gateway and Policy Engine

Goal: Route AI tool calls through a deterministic policy engine before any Casper action.

Constraints:

- LLM cannot decide final authorization.
- LLM cannot sign transactions.
- All policy decisions must have reason codes.

Acceptance:

- MCP server exposes Casper agent tools.
- Policy engine returns `allow`, `block`, or `needs_approval`.
- Over-budget action is blocked.
- Revoked agent action is blocked.
- Allowed service/action passes simulation.
- Tool calls and decisions are logged.

Required reason codes:

- `AGENT_REVOKED`
- `POLICY_EXPIRED`
- `SERVICE_NOT_ALLOWED`
- `AMOUNT_OVER_LIMIT`
- `APPROVAL_REQUIRED`
- `BUDGET_EXCEEDED`
- `ALLOWED`

