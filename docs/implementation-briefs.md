# Implementation Briefs

Status: Ready for implementation approval  
Format: Goal / Constraints / Acceptance

## Brief 0 - Validation Sprint

Goal: Confirm remaining platform and infrastructure details so implementation can proceed without blocking on unavailable sponsor resources.

Constraints: No implementation code. Use official DoraHacks, Casper, CSPR.click, CSPR.cloud, Odra, and toolkit sources. Keep fallback decisions explicit.

Acceptance: `docs/build-approval-checklist.md` has all critical items checked or consciously waived, including DoraHacks URL, deadline timezone, CSPR.fans mechanics, Testnet faucet/RPC/explorer, CSPR.click signing path, and MCP/x402 approach.

## Brief 1 - Monorepo Skeleton

Goal: Create a maintainable monorepo for AgentSafe Casper with web, API, MCP, contract, and shared package boundaries.

Constraints: Do not overbuild. Use TypeScript for app/API/MCP packages. Use Rust/Odra for contracts if compatible. Include `.env.example`, README scaffold, lint/type/test commands, and a single green-light command.

Acceptance: Fresh checkout installs dependencies, runs lint/typecheck/test placeholders, and exposes folders for `apps/web`, `apps/api`, `apps/mcp-server`, `contracts`, `packages/policy-engine`, `packages/shared-types`, and `docs`.

## Brief 2 - Casper Contract Proof

Goal: Implement and deploy minimal Casper Testnet contracts for agent registration, policy commitments, service registration, and receipt writing.

Constraints: Keep state and entrypoints simple. Prefer hashes for metadata. Do not implement escrow, custody, or complex marketplace logic in qualification round.

Acceptance: Contract tests pass; Testnet deployment succeeds; proof log records contract package hashes/addresses and tx hashes for agent registration, policy set, service registration, and receipt write.

## Brief 3 - Policy Engine

Goal: Build a deterministic policy engine that authorizes, blocks, or escalates proposed agent actions before signing.

Constraints: LLM output is untrusted. Engine must be pure/typed/testable. Every decision must include a reason code.

Acceptance: Unit tests cover `ALLOWED`, `AGENT_REVOKED`, `POLICY_EXPIRED`, `SERVICE_NOT_ALLOWED`, `AMOUNT_OVER_LIMIT`, `BUDGET_EXCEEDED`, `APPROVAL_REQUIRED`, and `DUPLICATE_ACTION`.

## Brief 4 - MCP Gateway

Goal: Expose Casper agent-commerce tools through an MCP-compatible gateway.

Constraints: Use official MCP patterns. If existing Casper MCP Server is easy to integrate, use it for read/query tools; keep project-specific policy and receipt tools in our gateway. No private keys in remote MCP.

Acceptance: MCP client can call tools to list services, simulate an action, request approval, execute an allowed action, write a receipt, and fetch receipt proof. Tool calls are logged with run ids.

## Brief 5 - Web Dashboard

Goal: Build a polished operational dashboard for wallet connection, agent policy management, action simulation, and receipt proof.

Constraints: First screen is the usable dashboard, not a landing page. Use stable layout dimensions. Show empty/loading/error/success states. Do not hide proof behind developer-only logs.

Acceptance: User can connect or simulate wallet flow, create/view an agent policy, run allowed and blocked prompts, and see transaction/receipt proof in a live timeline.

## Brief 6 - Agent Orchestration

Goal: Create one AI workflow where the agent proposes an RWA report purchase, routes through MCP, receives policy decision, and summarizes real proof.

Constraints: LLM cannot sign, override policy, or invent proof. Use a provider abstraction so model choice can change.

Acceptance: Demo prompt "buy one RWA risk report within my spending limit" results in an allowed action and receipt; prompt "buy ten RWA risk reports" results in a blocked action with `AMOUNT_OVER_LIMIT`.

## Brief 7 - Submission Package

Goal: Prepare the public repo, README, demo video, CSPR.fans copy, and DoraHacks submission assets.

Constraints: README top half must include pitch, live/demo links, and proof table. State Testnet-only and unaudited limitations. Record backup video.

Acceptance: Public repo is ready; demo video is public; README has proof links; `docs/submission-draft.md` has no unfilled required submission copy except live proof URLs that are filled after deployment.

