# Casper AI Toolkit Integration Plan

Status: Draft  
Purpose: map official Casper AI Toolkit resources to AgentPay Casper implementation.

## Official Toolkit Signals

The Casper AI Toolkit page frames Casper as the trust layer for the agent economy. It highlights:

- account abstraction
- upgradable contracts
- predictable fees
- x402 micropayments
- MCP-native blockchain access
- streaming events
- CSPR.click AI Agent Skill
- CSPR.cloud AI Agent Skill
- Odra Framework
- CSPR.trade MCP Server
- casper-eip-712 typed-data signing
- verifiable AI outputs

Sources:

- https://www.casper.network/ai
- https://github.com/make-software/casper-x402/tree/master/examples
- https://github.com/msanlisavas/casper-mcp
- https://mcp.cspr.trade/
- https://docs.cspr.cloud/
- https://docs.cspr.click/

## Integration Priority

### P0 - Required for Qualification

- Casper Testnet contracts.
- Odra, if compatible and fast enough.
- CSPR.cloud or explorer proof.
- MCP-compatible project gateway.
- x402-style paid API interface, even if full production x402 settlement is P1.

### P1 - Strong Finalist Signal

- Casper x402 examples integrated into demo paid RWA report service.
- Existing Casper MCP Server used for read/query proof.
- CSPR.click wallet connection/signing.
- CSPR.cloud streaming events for live dashboard.

### P2 - Final Round / Polish

- CSPR.trade MCP for DeFi quote/risk demo.
- casper-eip-712 typed-data signing for human-readable agent approvals.
- CSPR.click AI Agent Skill or CSPR.cloud AI Agent Skill included in docs/dev workflow.

## Recommended Architecture Adjustment

Use a layered MCP strategy:

1. **Existing Casper MCP Server** for generic chain reads if setup is fast.
2. **CSPR.trade MCP** for optional DeFi market data if Testnet/private mode works.
3. **AgentPay MCP Gateway** for our core differentiator:
   - policy simulation
   - paid API requests
   - checkout decisions
   - receipt writes/proof summaries
   - merchant service reads
   - proof summaries

This avoids rebuilding generic Casper read tools while keeping our unique project centered on safe agent commerce.

## x402 Strategy

Qualification fallback:

- Implement an x402-style interface for a paid RWA report endpoint.
- Record the paid service action as a Casper receipt.
- Explain full x402 settlement as P1 if package integration risks the deadline.

Preferred:

- Use the official Casper x402 examples for client/server flow.
- Buyer agent requests report.
- Server returns `402 Payment Required`.
- Agent/payment adapter satisfies payment.
- Casper receipt records service id, action hash, result hash, amount, and policy hash.

## CSPR.cloud Strategy

Use CSPR.cloud for:

- contract/package reads
- deploy/transaction status
- contract-level events if available quickly
- dashboard proof timeline

Fallback:

- explorer links and direct Casper client reads.

## CSPR.click Strategy

Use CSPR.click for:

- wallet aggregation
- app onboarding
- signing if Testnet transaction flow is confirmed
- CSPR.cloud proxy if helpful

Fallback:

- Casper Wallet or testnet demo signer, with explicit user approval and Testnet-only disclosure.
