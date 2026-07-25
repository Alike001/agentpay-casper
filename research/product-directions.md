# Phase 2: AgentPay Final-Round Product Directions

Date: 2026-07-25  
Constraint: preserve the submitted AgentPay BUIDL, deployed contracts, proof, and existing work. These are product-focus directions, not unrelated replacement projects.

## Ranking Method

Each direction is scored from 1-10. Weighted score: judge clarity 30%, feasibility 25%, depth potential 20%, ecosystem surprise 15%, Casper-native fit 10%.

| Rank | Direction | Clarity | Feasibility | Depth | Surprise | Casper fit | Weighted |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | AgentPay MCP Mandate Gateway | 9.5 | 9.0 | 10.0 | 9.0 | 10.0 | 9.45 |
| 2 | RWA Data Procurement Agent | 10.0 | 9.0 | 8.5 | 7.0 | 10.0 | 9.00 |
| 3 | AgentPay Tripwire | 9.0 | 7.0 | 9.5 | 10.0 | 10.0 | 8.85 |
| 4 | Casper Mandate Verifier | 8.5 | 8.0 | 9.0 | 8.5 | 10.0 | 8.63 |
| 5 | Safe x402 Checkout | 8.0 | 9.5 | 6.0 | 4.0 | 8.0 | 7.38 |

## 1. AgentPay MCP Mandate Gateway

**Type:** ecosystem infrastructure with a usable owner workbench.

**Specific Casper problem:** Casper MCP and x402 tooling can give an agent the ability to discover services, build transactions, and pay, but there is no common permission layer that proves which paid tools that agent is allowed to use, for how much, and for how long. Teams otherwise rely on server-held keys, one-off checks, or unrestricted wallets.

**Product:** AgentPay becomes the authorization gateway between an LLM/MCP client and paid Casper tools. An owner creates a revocable `MandateGuard` authority. Every paid MCP call is converted into a structured action, checked deterministically, authorized on Casper, settled through official x402, and attached to the mandate as evidence. The first complete integration remains one RWA risk-report tool so depth is preserved.

**Casper tools:** Odra `MandateGuard`, official MCP SDK, Casper x402 exact scheme, direct Casper Wallet signing with optional CSPR.click, CSPR.cloud confirmation/indexing, Casper Testnet transactions.

**Feasibility filter:** PASS. No custody, legal framework, or external approval institution is required. Most foundations already exist: the contract, typed MCP server, policy engine, transaction builders, persistent records, and x402 middleware.

**10-second story:** PASS - "MCP gives AI agents powerful tools but no spending permissions; AgentPay adds revocable Casper mandates before every paid tool call."

**Why it is not the obvious answer:** It is not another autonomous buyer or x402 checkout. It is reusable authorization infrastructure that makes other Casper agent products safer.

**Primary risk:** The story must stay focused on one paid tool and one end-to-end transaction; presenting a generic platform without a working integration would weaken it.

## 2. RWA Data Procurement Agent

**Type:** focused application built on the AgentPay infrastructure.

**Specific Casper problem:** Casper's RWA direction depends on off-chain risk, price, compliance, and document data. An RWA operator cannot safely give an AI agent an unrestricted wallet merely so it can purchase recurring reports from paid APIs.

**Product:** A wallet owner tells AgentPay what RWA data may be purchased. AI turns that request into a conservative draft, deterministic rules validate it, the owner signs the mandate, and the procurement agent autonomously buys one real x402-protected risk report within the allowance. An overspend attempt is rejected by the same mandate.

**Casper tools:** OpenAI structured drafting, Odra `MandateGuard`, direct Casper Wallet or CSPR.click, official Casper x402/WCSPR settlement, MCP tool call, CSPR.cloud confirmation and evidence.

**Feasibility filter:** PASS. This purchases data about RWAs; it does not custody tokenized assets, perform KYC, or make regulated investment decisions.

**10-second story:** PASS - "RWA teams need paid risk data, but AI agents should not get unlimited wallets; AgentPay lets them buy only approved reports within an on-chain budget."

**Why it is not the obvious answer:** Most RWA agents publish oracle data or trade assets. This direction focuses on safe machine procurement of the data those systems depend on.

**Primary risk:** It can look like a staged example unless the paid report is real, fresh, useful, and unlocked only after a verified settlement.

## 3. AgentPay Tripwire

**Type:** autonomous agent-security product.

**Specific Casper problem:** A valid agent mandate can still be abused by a compromised agent through unusual velocity, repeated failures, new service destinations, or spending patterns. Casper's future smart-account controls need a visible monitoring and emergency-response layer today.

**Product:** The owner appoints a limited guardian when creating a mandate. CSPR.cloud streams actions and settlements. AI explains suspicious context, while deterministic tripwire rules decide whether to alert or revoke. A triggered guard calls `revoke_mandate`, records the cause, and prevents subsequent actions.

**Casper tools:** upgraded Odra `MandateGuard` guardian role, CSPR.cloud Streaming API, MCP alerts/tools, direct wallet setup, Testnet revocation transaction, existing policy hashes and reason codes.

**Feasibility filter:** PASS WITH CONTRACT CHANGE. It needs no custody or legal authority, but automatic revocation must be explicitly delegated on-chain by the owner. AI must never hold unilateral revocation power.

**10-second story:** PASS - "If a Casper agent starts behaving abnormally, AgentPay revokes its spending authority before the next payment."

**Why it is not the obvious answer:** It treats agent commerce as an incident-response problem, not merely a payment or wallet problem.

**Primary risk:** A false-positive revocation harms availability. The deterministic trigger and owner-delegated guardian boundary must be simple enough to defend live.

## 4. Casper Mandate Verifier

**Type:** merchant-side API, SDK, and public proof explorer.

**Specific Casper problem:** A paid API or MCP provider can verify an x402 payment, but it cannot easily verify that the paying agent is acting under valid owner authority. Merchants and agent platforms lack a standard read surface for Casper spending mandates.

**Product:** A merchant calls AgentPay with agent, service, amount, and action hash. AgentPay reads the live mandate, returns an allow/block/approval result with reason codes, and later binds the x402 settlement to the same action. A small SDK or MCP tool makes this reusable by external services.

**Casper tools:** `MandateGuard` dictionary/events, CSPR.cloud reads and streaming, MCP Streamable HTTP, official x402 settlement evidence, Testnet explorer links.

**Feasibility filter:** PASS. It is non-custodial verification infrastructure and requires no external governance or regulated data.

**10-second story:** PASS - "x402 proves an agent paid; AgentPay proves the owner allowed that agent to pay."

**Why it is not the obvious answer:** It solves the missing authorization half of machine payments from the merchant side instead of building another payer wallet.

**Primary risk:** The verifier must read actual on-chain state, not trust AgentPay's JSON store, or its core claim collapses.

## 5. Safe x402 Checkout

**Type:** direct continuation of the qualification-round checkout product.

**Specific Casper problem:** AI agents need to buy paid APIs without exceeding wallet-owner budgets.

**Product:** The agent receives a 402 challenge, AgentPay checks limits, the wallet or agent signs an approved payment, and Casper records proof. The dashboard shows allowed and blocked requests.

**Casper tools:** Casper x402, Odra receipts/mandates, MCP, CSPR.click or direct Casper Wallet, CSPR.cloud.

**Feasibility filter:** PASS. It is the lowest-change direction and requires no custody or institutional dependencies.

**10-second story:** PASS - "AgentPay stops AI agents from overspending when they buy APIs on Casper."

**Why it is not the obvious answer:** It is the obvious answer. It is included as the saturation baseline, not the preferred final-round direction.

**Primary risk:** AiFinPay, AgentPay Trust Pass, Casper GW, and other finalists already occupy adjacent x402 payment/control territory. A polished checkout alone will be difficult to remember.

## Ranking Conclusion

The strongest direction is **AgentPay MCP Mandate Gateway** because it preserves every serious asset already built while changing the category from "another agent payment app" to "the authorization primitive Casper agent builders can reuse." The **RWA Data Procurement Agent** is the strongest concrete application and can serve as the gateway's single deep proof workflow. They should not be treated as two separate products if Direction 1 is selected: the gateway is the product, and RWA procurement is its first production integration.

No Phase 3 design direction or Phase 4 implementation decision is made here.
