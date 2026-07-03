# Epics - Casper Agent Commerce Firewall

Status: Draft  
Rule: each epic must leave behind working software or verifiable proof.

## Epic 0 - Sponsor Validation

Goal: remove assumptions before code.

Acceptance:

- DoraHacks page details captured.
- Judging criteria and submission requirements documented.
- Casper AI Toolkit integration path, Manifest role, and MCP layering decision documented.
- Testnet faucet/RPC/explorer confirmed.
- CSPR.click and CSPR.cloud Testnet feasibility confirmed.

## Epic 1 - Contract Proof

Goal: deploy minimal Casper Testnet contracts that prove the policy/receipt model.

Stories:

- Agent registry contract.
- Policy vault contract.
- Service registry contract.
- Receipt ledger contract.
- Contract tests.
- Testnet deployment script and proof log.

Acceptance:

- Contracts deploy to Testnet.
- At least one agent, policy, service, and receipt can be created.
- Events or queryable state prove the action.

## Epic 2 - Wallet Dashboard

Goal: user can manage an agent policy from a polished dashboard.

Stories:

- Dashboard shell.
- Wallet connection.
- Agent creation UI.
- Policy editor.
- Proof timeline.

Acceptance:

- User can connect wallet.
- User can create agent/policy.
- UI shows current policy and transaction proof.

## Epic 3 - MCP and Policy Engine

Goal: AI agent tool calls are routed through deterministic authorization.

Stories:

- MCP server scaffold.
- Casper tool definitions.
- Policy simulation service.
- Allow/block/approval decision logic.
- Tool-call audit logs.

Acceptance:

- Agent can request a service action.
- Allowed action passes.
- Over-budget action blocks.
- All decisions are logged with structured reason codes.

## Epic 4 - End-to-End Agent Action

Goal: one complete AI-to-Casper transaction path works.

Stories:

- Demo service.
- Agent orchestrator.
- Execute allowed action.
- Write receipt on Casper.
- Display receipt proof.

Acceptance:

- One user prompt causes a policy-checked action.
- Action results in a real Testnet transaction.
- Dashboard updates with receipt/proof.

## Epic 5 - Demo and Submission

Goal: make the project judge-ready.

Stories:

- README.
- Architecture diagram.
- Demo script.
- Backup video.
- Security and limitations doc.
- DoraHacks submission text.

Acceptance:

- A judge can understand, run, and verify the project.
- 90-second and 3-minute demos are rehearsed.
- Submission contains repo, video, proof links, and roadmap.
