# Domain Knowledge: AgentPay Casper Final Round

Research date: 2026-07-25  
Project commit inspected: `6cd9a18850223fcd2316d7f9e8f896772c7ea085`  
Hackathon: Casper Agentic Buildathon 2026 - Final Round

## Research Method And Boundaries

- The final-round rules and judging criteria were read from the complete DoraHacks text supplied by the project owner. Direct DoraHacks requests were challenged by AWS WAF on 2026-07-25, so the supplied text is the primary rules source.
- Official Casper pages, documentation, current public GitHub metadata, the submitted repository, deployed application, and Testnet evidence were checked directly.
- The official Casper x402, CSPR.click examples, CSPR.trade MCP, and community Casper MCP repositories were cloned into `/tmp/casper-agentpay-research` and inspected at source level.
- The five required reference-builder profiles were queried through the GitHub API on 2026-07-18. The three confirmed CSPR.fans community winners were re-checked at source level on 2026-07-25.
- Context7 was used for the current CSPR.click production AppID documentation. Public repositories, official raw sources, GitHub API data, direct HTTP checks, and Casper's pages published through 2026-07-22 were also checked. Firecrawl was not exposed as a callable tool in this session.
- This document records current reality. It does not select a new direction, prescribe a refactor, or begin implementation.

## 1. Judging criteria and track rules

### Hackathon purpose and judging

The organizer describes the desired output as production-ready applications at the intersection of Agentic AI, DeFi, and RWA on Casper. The final round is evaluated by a professional jury of Casper leadership and technical experts, partners, investors, ecosystem leaders, and media representatives.

Published criteria:

1. Technical Execution - code quality, architecture, and implementation completeness.
2. Innovation & Originality - novelty of approach, technology, and ideas.
3. Use of AI / Agentic Systems - meaningful use of autonomous agents.
4. Real-World Applicability - usefulness and relevance, especially in DeFi and RWA.
5. User Experience & Design - interface and interaction quality.
6. Working Smart Contracts - functional contracts deployed on Casper Testnet.
7. Long-Term Launch Plans - a real project with socials and actual deployment plans.
8. Potential for Long-Term Impact - contribution to Casper growth and adoption.

The organizer does not publish criterion weights. Treating the eight criteria as equally weighted is therefore an assumption, not a rule.

**Design/UX is explicitly a scored dimension** under "User Experience & Design." Phase 3 therefore deserves deliberate product design, but it must not replace the working transaction, AI, and contract depth scored separately.

Mandatory submission evidence remains:

- a working prototype deployed on Casper Testnet;
- a transaction-producing on-chain component;
- a public open-source repository with README and usage instructions;
- a public demo video.

Sources:

- Project-owner-supplied final-round DoraHacks text: <https://dorahacks.io/hackathon/casper-agentic-buildathon-finals/detail>
- Casper AI Toolkit: <https://www.casper.network/ai>
- Casper Agentic Buildathon announcement and Manifest recap: <https://www.casper.network/news/casper-x-space-recap-may-20-2026-casper-manifest-rwas-and-the-agentic-buildathon>

## 2. Chain/protocol domain knowledge

### What Casper is building toward

The Casper Manifest explicitly targets two converging markets: regulated RWA tokenization and the machine-to-machine economy. Its existing foundations are multi-VM execution, a unified account model, pluggable cryptography, fixed costs, and fee delegation. Its machine-economy roadmap includes x402 micropayments and smart accounts with scoped, time-bounded permissions and spending limits.

The strongest direct validation for AgentPay's problem comes from Casper Association CTO Michael Steuer. In the May 2026 recap, he states that x402 solves payment but agents also need controls such as one-hour permission windows, daily budgets, and access limited to specific contracts. The same recap says Casper wants agents that hold value, pay for services, operate within defined boundaries, and settle on Casper, rather than chatbots or LLM wrappers.

Verified protocol priorities as of 2026-07-18:

- x402 pay-per-request settlement for machines;
- scoped agent authority and predictable spending;
- MCP access to blockchain and DeFi tools;
- CSPR.click wallet connection and local signing;
- CSPR.cloud indexed reads, streaming, and node access;
- Odra contracts and verifiable on-chain outputs;
- RWA data pipelines, compliance, and ERC-3643-aligned infrastructure;
- reusable services that create an autonomous loop: discover, pay, use output, and trigger a subsequent action.

Sources:

- Casper Manifest: <https://www.casper.network/roadmap>
- Casper AI Toolkit launch: <https://www.casper.network/news/casper-ai-toolkit>
- Manifest/RWA/agent economy recap: <https://www.casper.network/news/casper-x-space-recap-may-20-2026-casper-manifest-rwas-and-the-agentic-buildathon>

### Current Casper x402 protocol reality

The official repository is a Go and TypeScript monorepo. It implements the x402 `exact` scheme on the `casper:*` CAIP-2 family and settles CEP-18 tokens through `transfer_with_authorization`, authorized with EIP-712 signatures.

The official flow is:

1. A resource server returns a structured x402 `402 Payment Required` response.
2. The client chooses a mutually supported payment requirement.
3. The client creates an EIP-712 authorization and retries with `PAYMENT-SIGNATURE`.
4. The resource server asks a facilitator to verify and settle.
5. The facilitator submits the CEP-18 `transfer_with_authorization` transaction and waits for execution.
6. The resource server returns the protected response and payment settlement data.

Important current details:

- Network identifiers are `casper:casper` and `casper:casper-test`, not simply `casper-test` inside x402 requirements.
- Payment requirements include an asset contract package hash, amount in smallest units, payee account hash, token name/version metadata, scheme, and timeout.
- The official TypeScript server example uses WCSPR with 9 decimals and an amount of `7500000000` motes.
- The facilitator verifies network, asset, payee, payer, amount, authorization time window, nonce, public-key/account-hash correspondence, and signature before settlement.
- The official browser example uses CSPR.click for EIP-712 signing.

Sources inspected:

- Repository: <https://github.com/make-software/casper-x402>
- Cloned commit: `14c364bb30838003302074423b7500b4360df889`
- Local source notes: `/tmp/casper-agentpay-research/casper-x402/README.md`
- TypeScript package: `/tmp/casper-agentpay-research/casper-x402/js/packages/mechanisms/casper`
- Server example: `/tmp/casper-agentpay-research/casper-x402/js/examples/server/index.ts`
- Client example: `/tmp/casper-agentpay-research/casper-x402/js/examples/client/index.ts`
- Facilitator implementation: `/tmp/casper-agentpay-research/casper-x402/js/packages/mechanisms/casper/src/exact/facilitator/scheme.ts`

Starter to reuse rather than reinvent: `@make-software/casper-x402` plus the official client, resource-server, facilitator, and CSPR.click examples.

### MCP reality on Casper

Casper currently has two relevant public MCP implementations:

- CSPR.trade MCP exposes a public Streamable HTTP endpoint and 24 public tools for market data, trading, liquidity, analysis, and account queries. It builds transactions remotely but keeps signing local in signer mode.
- `msanlisavas/casper-mcp` exposes 82 tools over stdio and stateless Streamable HTTP. It uses CSPR.cloud, per-request API keys and network selection, optional API-key/JWT protection, policy-controlled local writes, spend ledgers, audit logs, Docker deployment, health/readiness endpoints, and broad tests.

Production MCP conventions observed in source:

- a real MCP SDK and transport, not only JSON-RPC method names;
- typed input schemas and structured tool results;
- `stdio` for local trusted signing and Streamable HTTP for remote access;
- authentication and per-tenant credential isolation;
- explicit separation between transaction building, signing, and submission;
- health/readiness/observability;
- package distribution, agent configuration examples, and integration tests.

Sources:

- CSPR.trade MCP: <https://github.com/make-software/cspr-trade-mcp>
- Public endpoint/docs: <https://mcp.cspr.trade/>
- Cloned commit: `58b3399ef309e711b11fbb5e8b37c5e80364a1a6`
- Casper MCP: <https://github.com/msanlisavas/casper-mcp>
- Cloned commit: `c89b4e6bad0439180854a6916c35555637a6bafe`

Starter to reuse rather than reinvent: an official MCP SDK transport and existing Casper/CSPR.trade tools for generic chain and market operations; project-specific tools should cover only the product's unique policy/payment behavior.

### CSPR.click reality

CSPR.click is Casper's wallet aggregation and onboarding SDK. It supports wallet connections, social login, fiat on-ramps, CSPR.cloud proxy access, transaction/message signing, and all Casper wallets. A deployed application needs its own application ID from the CSPR.build console; the template ID works only on localhost.

The official examples repository includes HTML/JavaScript, TypeScript, React, Blazor, Next.js references, and an installable CSPR.click agent skill. This means AgentPay can preserve a browser application while adopting the chain's supported signing flow.

Sources:

- Docs: <https://docs.cspr.click/>
- Vanilla JavaScript integration: <https://docs.cspr.click/cspr.click-sdk/javascript>
- Examples: <https://github.com/make-software/csprclick-examples>
- Cloned commit: `40a436e3f105ca106a9a6481c4b48b452c757bcf`

Starter to reuse rather than reinvent: the official `csprclick-html` or React integration and the CSPR.click x402 example in the Casper x402 repository.

The production AppID path has one operational constraint: a CSPR.cloud key and a CSPR.click AppID are different credentials. The UUID created in the owner's CSPR.cloud key table was rejected by `accounts.cspr.click` as `wrong application id`. The CSPR.build frontend exposes the CSPR.click key manager only to accounts with `ClickKeyManagement`; the owner's current individual account shows only CSPR.cloud key creation despite the free CSPR.click subscription. There is no documented way to derive or convert a CSPR.cloud key into an AppID.

This does **not** block owner-signed Casper transactions. MAKE's official `casper-wallet-sdk` repository documents the extension-injected `window.CasperWalletProvider()` API with `requestConnection()`, `getActivePublicKey()`, `sign()`, `signMessage()`, and `signTypedData()`. CSPR.click is the recommended multi-wallet integration, but direct Casper Wallet support remains an official, working browser interface and does not require a CSPR.click AppID. Agent Casper independently uses this exact fallback pattern when its CSPR.click AppID is absent.

Sources:

- CSPR.click production AppID overview: <https://docs.cspr.click/documentation/overview>
- CSPR.build console: <https://console.cspr.build/>
- Official Casper Wallet SDK: <https://github.com/make-software/casper-wallet-sdk>
- Official injected provider implementation: <https://github.com/make-software/casper-wallet/blob/dev/src/content/sdk.ts>
- Reference fallback: <https://github.com/kataenda/agent-casper/blob/master/frontend/src/components/WalletWidget.tsx>

### CSPR.cloud reality

CSPR.cloud V2 exposes:

- REST APIs for indexed and normalized Casper data;
- WebSocket streaming APIs;
- maintained Casper node RPC and SSE endpoints;
- contract/package, deploy, transfer, token, DEX, swap, account, and validator entities;
- access-token authorization, quotas, pagination, filtering, sorting, and optional related data.

Testnet endpoints include `https://api.testnet.cspr.cloud`, `wss://streaming.testnet.cspr.cloud`, and `https://node.testnet.cspr.cloud`. It is an authenticated middleware product, not just an explorer link.

Sources:

- Overview: <https://docs.cspr.cloud/documentation/overview>
- REST reference: <https://docs.cspr.cloud/rest-api/reference>
- Getting started: <https://docs.cspr.cloud/1.5.x/documentation/getting-started>

### Odra and Casper contract reality

Odra 2.8.0 is the current documented Rust contract framework for Casper. It provides Casper and local test backends, module/storage abstractions, payable entry points, errors, contract calls, and both Casper Event Standard and native Casper 2.0 events. Odra supports building Wasm and deploying through `casper-client` or its livenet integration.

Casper 2.0 introduced Transactions as the successor to legacy Deploys. Deploys remain accepted but are deprecated. Current contract work should therefore be explicit about whether evidence is a legacy deploy or a Casper 2.0 transaction.

Sources:

- Odra 2.8 docs: <https://odra.dev/docs/>
- Casper backend: <https://odra.dev/docs/backends/casper/>
- Casper transactions: <https://docs.casper.network/concepts/transactions>
- Casper SDK list: <https://docs.casper.network/sdk>

### Qualification baseline before final-round work

This subsection preserves the verified 2026-07-18 baseline for comparison. It is superseded by the 2026-07-25 update below.

Product claim at that point: AI-agent API payments on Casper with deterministic spending policy and on-chain receipts.

Verified working surfaces on 2026-07-18:

- Public repository: <https://github.com/Alike001/agentpay-casper>
- Repository is public, MIT licensed, and local `main` matches public `main` at commit `ede37c1`.
- Landing page returned HTTP 200: <https://agentsafe-casper.onrender.com/>
- Dashboard returned HTTP 200: <https://agentsafe-casper.onrender.com/dashboard>
- Health endpoint returned `{ "ok": true, "service": "agentpay-casper" }`.
- Unpaid RWA endpoint returned real HTTP 402 with amount, network, service, and receipt-contract headers.
- Deterministic policy code checks agent status, policy status/expiry, service validity/allowlist, idempotency, per-action cap, daily budget, and approval threshold.
- Rust core policy tests passed: 3/3.
- Odra `ReceiptLedger` test passed: 1/1.
- The Testnet proof file records a deployed package and one receipt-write transaction.

Testnet evidence:

- Package: `hash-aa362adaa1dbb9e67491e25206592104739e760ef754c8314d1b56bdda347833`
- Install/deploy transaction: <https://testnet.cspr.live/transaction/cd352660b8e2d1de2df2a52a1e043774be139467f0c0ba57b7fc2e9e88b2c411>
- Receipt write: <https://testnet.cspr.live/transaction/3116400a1250d9bdfd76f7c80a07ec5474f4c48c219c710794cb2f304b79bd86>
- Local evidence: `proof/testnet-proof.json`

Verified boundaries in the submitted code:

- The live API labels its rail `x402-style`; it does not use the official `@make-software/casper-x402` package.
- It uses custom `x-payment-*` headers and `x-agentpay-receipt`, not the official structured `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, facilitator verification/settlement, and `PAYMENT-RESPONSE` flow.
- The paid endpoint accepts the hard-coded value `agentpay-demo-approved` as valid receipt proof.
- Clicking the allowed dashboard action changes in-memory session state and creates a `testnet-demo-*` receipt. It does not submit a new Casper payment or receipt transaction.
- Every allowed run is displayed alongside the same historical Testnet receipt transaction loaded from `proof/testnet-proof.json`.
- The HTTP 402 says the currency is native `CSPR`; the current official Casper x402 implementation settles CEP-18 assets, and the official example uses WCSPR.
- The MCP surface implements only `tools/list` and `tools/call` through custom JSON-RPC. Tool definitions have names/descriptions but no input schemas. It does not use an MCP SDK or standard transport lifecycle.
- There is no LLM or AI-provider integration in the source. The visible autonomous run is a deterministic prewritten sequence triggered by dashboard buttons.
- There is no CSPR.click wallet connection/signing and no CSPR.cloud API/stream integration.
- State is process memory only. There are no users, merchant accounts, authentication, durable policies, durable service catalog, or durable receipts.
- Checkout configuration changes only browser presentation values; it does not update the backend service price or policy engine.
- `ReceiptLedger.write_receipt` has no caller authorization and stores only the latest receipt fields plus a count. Any caller able to invoke it can overwrite the displayed latest receipt values.
- The one recorded chain proof refers to `agentsafe-demo-agent`, a 12.5 CSPR amount, and historical action/service identifiers, while the current UI demonstrates `agent-rwa-001`, `svc-rwa-risk`, and 10 CSPR.
- The public URL still contains `agentsafe-casper`, while the product and repository are AgentPay.

Current verification result on 2026-07-18:

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run proof:readiness`: pass.
- `npm run contracts:test`: pass.
- `npm run contracts:odra:test`: pass.
- `npm test`: fail, 1 test file passed and 2 failed.

The JavaScript failures are deterministic: `createDemoState()` defaults to `2026-07-03` and creates a policy that expired seven days later. On 2026-07-18, tests expecting `ALLOWED`, `AMOUNT_OVER_LIMIT`, `APPROVAL_REQUIRED`, or `DUPLICATE_ACTION` receive `POLICY_EXPIRED`. The live server calls `createDemoState(new Date())`, so this exact fixture-expiry failure does not currently break the deployed flow.

Primary local evidence:

- `README.md`
- `apps/api/server.js`
- `apps/mcp-server/tools.js`
- `apps/web/app.js`
- `packages/policy-engine/index.js`
- `contracts/agent-safe-odra/src/lib.rs`
- `contracts/agent-safe-core/src/lib.rs`
- `tests/*.test.js`
- `proof/testnet-proof.json`
- `SECURITY.md`

### 2026-07-18 baseline inferences

These are evidence-based interpretations, not published Casper statements:

- AgentPay's core problem is strongly validated by Casper's own stated need for bounded agent spending.
- Qualification-level proof is present, but the present implementation is materially behind the protocol's current production x402 and MCP reference implementations.
- The current product demonstrates the idea of an agent checkout policy layer more strongly than it demonstrates a functioning autonomous AI buyer.
- The final-round jury can verify the contract and one transaction, but it can also verify that repeated dashboard runs do not produce new settlement transactions.

### Current AgentPay reality on 2026-07-25

The final-round product claim is now narrower and stronger: **wallet-owned spending mandates for AI agents on Casper**. The LLM may draft constraints, but deterministic code and the Odra contract enforce authority; the owner wallet alone signs creation and revocation.

Verified improvements at commit `6cd9a18850223fcd2316d7f9e8f896772c7ea085`:

- `MandateGuard` is a real Odra contract with owner/agent identities, service allowlisting, per-action limits, daily budgets, approval thresholds, validity windows, duplicate-action prevention, settlement attachment, and owner revocation.
- The contract is deployed on Casper Testnet at package `hash-eb5d3394550f634cf6c5ad6629a9b75362aea1cc2957319ea92a3eeee41db222`.
- The installation transaction `751dd46f...` and `create_mandate` transaction `afe0c811...` are recorded with successful RPC verification in `proof/mandate-guard-testnet-proof.json`.
- The web workbench creates durable mandate drafts and execution records through an atomic JSON file store instead of relying only on process memory.
- Unsigned Casper 2.0 activation and revocation transactions are built from the validated mandate. Submission remains pending until chain confirmation; the UI does not mark a submitted revocation as completed.
- OpenAI Responses API integration compiles natural-language intent into a strict structured mandate draft. It is deliberately draft-only and cannot authorize or sign.
- The project-specific MCP surface now uses the official Model Context Protocol SDK, typed Zod inputs, structured results, and Streamable HTTP.
- The official `@make-software/casper-x402`, `@x402/core`, and `@x402/express` packages are integrated behind configuration. The server refuses to claim settlement and returns 503 until facilitator, payee, asset package, and asset metadata are configured.
- The complete local gate passed on 2026-07-25: lint, type check, 9 JavaScript suites, 3 Rust core tests, 3 Odra tests, build, and proof-readiness.
- The deployed service woke successfully and returned `{ "ok": true, "service": "agentpay-casper", "version": "0.2.0" }` from `/healthz`.

Current verified limitations:

- The deployed OpenAI, Casper x402, and CSPR.cloud integrations are unconfigured. The AI drafting code exists, but the public deployment cannot currently call it.
- Render currently exposes the rejected CSPR.cloud UUID as `CSPR_CLICK_APP_ID` and labels the wallet integration configured merely because the environment variable is non-empty. The actual CSPR.click application lookup rejected this UUID, so CSPR.click signing is not working.
- Direct Casper Wallet signing is not yet implemented in AgentPay, although it is supported by MAKE's official wallet provider and does not require a CSPR.click AppID.
- The known Testnet mandate proves real owner-defined authority, but a fresh judge-created mandate cannot yet be signed from the public workbench while wallet integration is blocked.
- Official x402 end-to-end settlement remains absent. No action has yet gone through mandate authorization, WCSPR settlement, paid resource delivery, and `record_settlement` as one verified loop.
- CSPR.cloud reads/streaming are not configured, and automatic transaction-confirmation reconciliation is therefore absent.
- The qualification `/api/run-demo` and custom `x-agentpay-receipt` surface remain in the code beside the newer mandate product. They can blur the product story if judges encounter them before the real mandate workbench.
- JSON persistence is suitable for one Render instance but is not multi-instance or tenant-grade storage.

Current inference: AgentPay now has a defensible Casper-native primitive, not only a checkout simulation. Its strongest unique claim is **revocable on-chain authority that constrains an agent before payment**, not generic HTTP 402 payment. The missing piece is a public, repeatable transaction loop that lets a judge create, sign, exercise, and revoke that authority.

## 3. What's trending right now

### Current Casper narratives

1. **Real x402 settlement, not only HTTP 402 UX.** Casper announced a live x402 facilitator and official Go/TypeScript implementations in June 2026. Current finalist projects are already showing accepted Testnet settlements.
2. **Bounded machine authority.** Spending caps, scoped credentials, local signing, revocation, time windows, replay protection, and audit receipts are recurring themes across Casper's Manifest and current builders.
3. **Agent-service infrastructure.** Provider registration, service discovery, API keys/agent credentials, paid MCP tools, and public receipt explorers are becoming concrete products.
4. **MCP as a deployable interface.** Current tools ship public endpoints, client configs, packages, SDKs, health checks, and local signer separation.
5. **RWA proof and compliance.** Casper is investing in Proof Layer, Parking Blox, ERC-3643 alignment, identity/compliance registries, privacy, and verifiable data pipelines.
6. **DeFi composability.** CSPR.trade, liquid staking, Styks Oracle, Casper Delta, and the bridge are assembling the primitives agents can act on.
7. **Honest proof boundaries.** Strong public projects explicitly distinguish what is live, what is Testnet-only, who holds keys, and which paths are not yet supported.

### Teams and funding signals

- Casper Association is funding this Buildathon with $30,000 cash, $100,000 in x402 ecosystem credits, and $20,000 in co-sponsor rewards.
- Casper states that top projects may receive technical mentorship, marketing, grants, incubation, and sponsored x402 transactions for mainnet launch.
- MAKE/CSPR.cloud is actively shipping the Casper x402 reference, CSPR.trade MCP, CSPR.click examples, wallet tooling, and CSPR.design.
- Odra documentation was updated in June 2026 and identifies version 2.8.0.
- The Association says 2026 H2 targets include x402 production support, EVM compatibility, gasless transactions, and ERC-3643 phase one.

### Current saturation signal

The broad idea "an AI agent pays an API through x402" is no longer scarce in this competition.

Public overlapping products found:

- **Casper GW**: provider registration, priced MCP/API tools, scoped agent API keys, hosted facilitator settlement, WCSPR, settlement explorer, and real Testnet settlement hashes. <https://github.com/Blockchain-Oracle/casper-agentic>
- **AgentPay Trust Pass**: checks x402 charges before local signing, produces PAY/REVIEW/BLOCK decisions, verifies executed transfers, issues tamper-evident receipts, exposes web/CLI/MCP/client surfaces, and records Testnet anchors. <https://github.com/Timidan/agentpay-trust-pass>
- **Writ**: agent-operated RWA compliance with six Odra contracts, ZK eligibility, transfer filters, challenge/slashing, CSPR.click, and CSPR.cloud. <https://github.com/winsznx/writ>
- **AgentPay Guard**: a public page describing real x402 services, policy controls, settlement receipts, and CSPR.cloud-backed account data. <https://agent-pay-guard.vercel.app/>

Inference: final-round differentiation cannot rely on the words "x402", "policy", "receipt", "MCP", or "AgentPay" by themselves because multiple finalists now use the same category language.

### CSPR.fans top-three community winners

These projects advanced automatically because they received the most community votes. This proves messaging and community appeal; it does **not** mean a professional jury ranked them as the three strongest technical products.

#### AiFinPay

- BUIDL: <https://dorahacks.io/buidl/44178>
- Repository inspected: <https://github.com/AiFinPay/casper-contract> at `c834629269dc3890bd39487faf1eb71284648255`
- Story: payment infrastructure and agent identity for autonomous AI services, with Casper used as the settlement ledger.
- Strengths: exceptional documentation/community standards, clear infrastructure positioning, MCP tooling, real Testnet and claimed mainnet transaction evidence, idempotent request IDs, and a very easy 30-second story.
- Source-level boundary: its `pay_agent` contract records a settlement but does not transfer value. The README's mainnet proof lists the contract settlement and the value transfer as separate deploys. Its bridge uses a custom `pay_casper` challenge rather than the official Casper x402 exact scheme, its MCP server holds the funded signing key, and its compute result defaults to an explicitly labelled mock unless an upstream model is configured.

#### Agent Casper

- BUIDL: <https://dorahacks.io/buidl/44340>
- Repository inspected: <https://github.com/kataenda/agent-casper> at `85b1b45bc5a6c73b621c26df3a25995fbbdea912`
- Story: an autonomous, RWA-aware Casper yield vault that decides, stakes, swaps, and sells data.
- Strengths: deepest visible implementation of the three: an Odra vault, real custody claims with explorer evidence, validator delegation, Claude-assisted decisions with deterministic fallback, CSPR.trade integration, x402 code, CSPR.cloud reads, persistent records, wallet auth, multiple product surfaces, and explicit live-versus-roadmap boundaries.
- Source-level boundary: the product spans many claims and workflows, increasing audit surface and weakening 30-second focus. It relies on an agent-held server key for autonomous execution, has a substantial operational/security burden, and the inspected tree exposes scripts rather than an obvious conventional automated test suite. CSPR.click is optional; its frontend falls back to direct Casper Wallet integration.

#### Casper HiveMind

- BUIDL: <https://dorahacks.io/buidl/45907>
- Repository inspected: <https://github.com/Civil1488/casper-hivemind> at `24e80a9e7439e1fade84745adb074eb90f1792e7`
- Story: when an AI is uncertain, it hires a human in Telegram and pays them in CSPR.
- Strengths: the most memorable, human, and viral story. Telegram removes dashboard friction and real Testnet transfers can produce clear proof.
- Source-level boundary: the entire implementation is one Python file. Confidence values are random, wallet strings are fabricated, the central bot key pays through a shell command, the 402 check accepts a fixed header, and the README lists real AI integration and on-chain reputation as roadmap. No smart contract is present in the repository.

Community-vote inference: voters rewarded a crisp story and visible outcome more than protocol purity alone. Final-jury competition will add pressure for evidence, architecture, and honest security boundaries. AgentPay should learn from the clarity of HiveMind and the depth of Agent Casper without imitating either product.

## 4. Past winners (this hackathon or similar ones on this chain)

The official Casper February 2026 recap identifies four prior Casper Hackathon winners. The Association reports 450+ registrations, 117 qualified projects, and 45 finalists.

### CasPay - Main Track, 1st

- Product: subscription and payment infrastructure for Casper, including merchant dashboard, wallet integration, recurring billing, SDK, payment links, analytics, and on-chain records.
- Repository: <https://github.com/dmrdvn/caspay>
- Contract repository: <https://github.com/dmrdvn/caspay-contract>
- Live product: <https://caspay.link/>
- Why it likely won (inference): it was a complete merchant product rather than one isolated contract. It combined reusable SDKs, clear user workflows, anti-replay/security framing, Testnet proof, documentation, and a mainnet/pilot roadmap.
- What could be improved: parts of the public site make broad enterprise and adoption claims while its own counters display zero activity; its README also labels some demo transaction hashes as mock. Claims need strict evidence boundaries.

### Shroud Protocol - Main Track, 2nd

- Product: a non-custodial Casper privacy mixer using fixed deposits, a Merkle tree, secret withdrawal keys, and zero-knowledge proofs.
- Live product: <https://www.shroud.live/>
- Public GitHub link: the live site advertises GitHub, but the exact repository URL could not be resolved through available search/API tools. This remains an explicit research unknown.
- Why it likely won (inference): the chain was fundamental to custody, proof verification, deposit, and withdrawal; the product had an immediate privacy story and a live Testnet workflow.
- What could be improved: privacy-mixer products carry regulatory and trust concerns, and setup/secret handling can create user risk. It also sits outside this project's feasibility filter for a new direction.

### CasperLink - Main Track, 3rd

- Product: an intent-based DeFi execution framework that turns a requested swap into an on-chain intent, price-oracle read, CSPR.trade execution, CSPR.click signing, and verifiable transaction.
- Repository: <https://github.com/SohamJuneja/CasperLink>
- Why it likely won (inference): it used several Casper-native tools together and showed a real DEX swap rather than stopping at intent parsing. The README leads with a successful transaction and deployed contract hashes.
- What could be improved: the public flow still includes a user click and signature, so claims of full autonomy need careful wording; parts of the cross-chain bridge path were marked in progress.

### BridgeX - Interoperability Track winner

- Product: a bridge intended to deepen Casper cross-chain connectivity.
- Official description: <https://www.casper.network/news/casper-x-space-recap-feb-5-2026-parking-mvp-goes-live-defi-expands-hackathon-winners-and-live-q-a>
- Public GitHub repository: not identified in the sources checked.
- Why it likely won (inference): it addressed a known Casper ecosystem constraint, external liquidity/connectivity, and aligned with the network's audited bridge roadmap.
- What could be improved: the official recap provides too little public technical evidence to assess its implementation quality.

### Cross-winner pattern

Verified common pattern plus inference:

- The chain does real work, not only record a generic hash.
- The product has a visible end-to-end transaction.
- Multiple ecosystem tools are integrated coherently.
- Public proof, docs, and a launch story make the build inspectable.
- Winners solve an ecosystem gap that can continue after the hackathon.

The prior winner set is weighted toward reusable infrastructure/protocols: CasPay, CasperLink, and BridgeX are infrastructure or developer-facing rails; Shroud is a focused end-user protocol. This supports keeping an infrastructure angle, but only when a user can exercise it through a concrete product workflow.

Official winner source: <https://www.casper.network/news/casper-x-space-recap-feb-5-2026-parking-mvp-goes-live-defi-expands-hackathon-winners-and-live-q-a>

## 5. Reference builders

GitHub profiles were checked through the public API on 2026-07-18. This section records current visible patterns; it does not endorse or copy their products.

### winsznx

Profile: <https://github.com/winsznx>

Current relevant repositories include Writ, BotSpend, Nulth, Ward, Stxact, and several x402/agent-commerce products. Repeated pattern: one sharply stated trust problem, real chain-specific enforcement, adversarial/security proof, extensive transaction evidence, explicit honesty boundaries, and a narrow live workflow supported by deep contracts.

### Timidan

Profile: <https://github.com/Timidan>

Current relevant repositories include `agentpay-trust-pass`, Sentry Somnia, and Vibetrace. Repeated pattern: policy enforcement and evidence are packaged as reusable surfaces for people, agents, and developers. The current AgentPay project is a direct naming and problem-space collision with this submission.

### Blockchain-Oracle

Profile: <https://github.com/Blockchain-Oracle>

Current Casper repositories include CSPR.AI and Casper GW. CSPR.AI ships a dashboard, docs, public MCP endpoint, 50+ tools, CSPR.click, CSPR.cloud, and four Testnet contracts. Casper GW ships provider registration, paid MCP calls, API keys, Postgres persistence, real x402 settlement, Testnet/mainnet deployments, an explorer, architecture diagrams, and explicit limitations. Repeated pattern: product surfaces plus reusable developer infrastructure and public proof.

### mrnetwork0001

Profile: <https://github.com/mrnetwork0001>

Current work includes Inktoll, Rheon, Fluenci, Vero, and other agent/payment/security projects. Repeated pattern: combine a payment primitive with a specific market workflow, a dashboard, contracts, and an autonomous monitor/guard rather than presenting payment alone as the product.

### Enoch208

Profile: <https://github.com/Enoch208>

Current relevant work includes Clasp, a scoped and revocable wallet-session product with permission controls, spending limits, real payments, replay protection, and revocation. Repeated pattern: a simple product sentence backed by a concrete security boundary and a transaction users can verify.

### Reference-builder inference

The strongest current builders do not win attention with visual polish alone. They make one hard claim, implement it in the chain's native primitives, expose the failure path, provide transaction evidence, and document exactly what is and is not live.

## 6. Existing production tools in this ecosystem

### Casper x402

- Repository: <https://github.com/make-software/casper-x402>
- Inspected locally at commit `14c364b`.
- Professional benchmark: parallel Go/TypeScript implementations, package boundaries for client/server/facilitator, CAIP-2 networks, EIP-712, tests for each scheme role, Docker/NCTL infrastructure, CSPR.click browser example, configuration docs, security/community files, and runnable end-to-end examples.
- Product lesson (inference): protocol claims should use the reference package and produce facilitator settlement evidence.

### CSPR.trade MCP

- Repository: <https://github.com/make-software/cspr-trade-mcp>
- Inspected locally at commit `58b3399`.
- Live endpoint: <https://mcp.cspr.trade/mcp>
- Professional benchmark: public endpoint, 24 tools, remote transaction building, local signer mode, SDK package, MCP package, agent skill, docs site, Docker/systemd deployment, session cleanup, input validation, analysis utilities, and broad unit/integration tests.
- Product lesson (inference): an MCP product is installable and usable by external agents, not only visible inside its own dashboard.

### Casper MCP

- Repository: <https://github.com/msanlisavas/casper-mcp>
- Inspected locally at commit `c89b4e6`.
- Professional benchmark: 82 tools, stdio and stateless Streamable HTTP, CSPR.cloud integration, per-request tenant keys, network override, API-key/JWT auth, local-only writes, policy engine, spend ledger, audit log, observability, Docker, release binaries, and extensive tests.
- Product lesson (inference): remote access, signing, policy, and tenant credentials need separate trust boundaries.

### CSPR.click examples

- Repository: <https://github.com/make-software/csprclick-examples>
- Inspected locally at commit `40a436e`.
- Professional benchmark: supported patterns for plain HTML/JavaScript, TypeScript, React, Next.js, and Blazor, plus an installable agent skill and community/security documentation.
- Product lesson (inference): the existing static frontend stack is not a blocker to real Casper wallet integration.

### Casper Wallet SDK

- Repository: <https://github.com/make-software/casper-wallet-sdk>
- Provider source: <https://github.com/make-software/casper-wallet/blob/37292fd551dd998d9bd528650647da94c9fb7b31/src/content/sdk.ts>
- Professional benchmark: the extension injects `CasperWalletProvider` asynchronously and supports connection, active-key reads, account switching, Casper transaction signing, message signing, EIP-712 typed-data signing, feature detection, and state events.
- Product lesson (inference): CSPR.click is the recommended multi-wallet layer, but it is not a hard dependency for a real owner-wallet Testnet workflow. Direct Casper Wallet support is a documented and technically compatible fallback.

### What professional Casper products currently look like

Across these repositories, production-oriented projects generally include:

- one documented package or endpoint another developer can actually consume;
- supported wallet/signing flow with private keys kept local;
- explicit Testnet/mainnet/network configuration;
- real transaction or settlement evidence per meaningful action;
- durable state where the product promises accounts, policies, catalogs, or receipts;
- standard protocol transports and schemas;
- authentication, failure handling, health checks, and observability;
- tests at unit and integration boundaries;
- honest capability/limitation documentation;
- a public product URL, repository, setup path, and launch plan.

## Phase 1 Conclusions

Verified:

- AgentPay solves a problem Casper explicitly says matters: agents need scoped permissions, time windows, spending limits, and revocation in addition to payment rails.
- Design/UX is explicitly scored, alongside technical execution, AI, smart contracts, applicability, launch plans, and ecosystem impact.
- The current final-round build is materially stronger than the qualification baseline: a live Odra `MandateGuard`, a verified `create_mandate` transaction, deterministic policy enforcement, durable local records, OpenAI structured drafting code, an official MCP server, and an official Casper x402 adapter.
- The full local quality gate is green. The public Render service is live, but OpenAI, x402 settlement, and CSPR.cloud are not configured.
- The configured CSPR.click UUID is invalid because it is a CSPR.cloud key, not an AppID. This is an account-console blocker, not a Casper transaction blocker.
- MAKE's official Casper Wallet provider gives AgentPay a documented AppID-free route for owner connection, transaction signing, message signing, and EIP-712 signing.
- The public product still lacks one repeatable end-to-end loop: create mandate, owner signs, agent acts within it, official WCSPR x402 settles, result is delivered, settlement is attached, and owner revokes.
- The top-three community winners prove that a memorable 10-second story matters. They are not a professional technical ranking: one is deeply implemented, one has strong settlement infrastructure with protocol caveats, and one is highly memorable but mostly a centralized prototype.
- AgentPay's defensible distinction is no longer "agents pay APIs." It is the already-deployed, revocable Casper authority layer that controls what an agent is allowed to pay before settlement.

Open research questions to carry into the next approved phase:

- Which exact x402 facilitator credentials/credits have been issued to finalists, and what Testnet WCSPR asset/funding path is available to this project?
- Whether CSPR.build support will enable `ClickKeyManagement` on the owner's personal organization before submission.
- Whether the current Render service has persistent-disk configuration for `.data/agentpay.json`; repository-level persistence alone does not guarantee survival across Render replacement deploys.
- Is `AgentPay` acceptable as a final-round name given the current public finalist using the same name?
- Does the final-round resubmission form require the same repository/BUIDL identity while permitting a refined product name and functionality?
- Which judging criteria, if any, are weighted more heavily in the jury scorecard?
- Is there a scheduled mentor review where the team can confirm the expected level of x402 and agent autonomy?

## Not Included

- No Phase 2 ideas or direction ranking.
- No design direction.
- No implementation plan.
- No code or product changes.
- No recommendation to continue, improve, or pivot yet.
