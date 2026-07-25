# Final-Round Design Direction

Decision date: 2026-07-25

## Selected direction

AgentPay will use a policy-first control-plane interface for its MCP Mandate Gateway. The wallet-owned spending mandate is the primary product object; paid MCP requests, deterministic decisions, x402 settlement state, and Casper proof are shown in that mandate's context.

The product's short story is:

> MCP gives AI agents powerful tools but no spending permissions. AgentPay adds revocable Casper mandates before every paid tool call.

## Reference research

- [Cloudflare WAF custom rules](https://developers.cloudflare.com/waf/custom-rules/create-dashboard/) for readable policy composition and explicit enforcement outcomes.
- [Infisical access controls](https://infisical.com/docs/documentation/platform/access-controls/overview) for identity, bounded authority, temporary access, and revocation hierarchy.
- [Inngest traces](https://www.inngest.com/docs/platform/monitor/traces) for inspectable request lifecycles and contextual step evidence.
- [Stripe Workbench](https://docs.stripe.com/workbench/overview) for compact developer logs, exact error states, and proof attached to individual requests.

Only interaction and information-hierarchy patterns are references. AgentPay retains its own product model, content, Casper branding, and implementation.

## Why this direction

- It makes the unique product primitive, revocable on-chain agent authority, visible before generic payment functionality.
- It shows a judge the problem and solution in one screen: a paid MCP action enters, the mandate allows or blocks it, and Casper evidence appears only when real execution occurs.
- It supports a real owner workflow: create, review, sign, activate, inspect, and revoke a mandate.
- It preserves the existing landing/workbench split and core implementation instead of requiring a restart.
- It maps directly to the scored UX, technical execution, agentic systems, smart-contract, real-world applicability, and ecosystem-impact criteria.

## Implementation boundary

The final-round core remains one deep RWA risk-report MCP workflow. The interface must never represent wallet signing, x402 settlement, AI drafting, CSPR.click, or Casper execution as successful unless the corresponding integration and evidence are real.
