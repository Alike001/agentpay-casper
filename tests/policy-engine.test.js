import assert from "node:assert/strict";
import test from "node:test";
import { applyAllowedAction, createDemoState, evaluatePolicy, ReasonCode } from "../packages/policy-engine/index.js";

test("allows an in-policy RWA report purchase", () => {
  const state = createDemoState();
  const result = evaluatePolicy(state, action({ amount: 10, idempotencyKey: "allow-1" }));
  assert.equal(result.verdict, "allow");
  assert.equal(result.reasonCode, ReasonCode.ALLOWED);
});

test("blocks over per-action limit", () => {
  const state = createDemoState();
  const result = evaluatePolicy(state, action({ amount: 100, idempotencyKey: "over-1" }));
  assert.equal(result.verdict, "block");
  assert.equal(result.reasonCode, ReasonCode.AMOUNT_OVER_LIMIT);
});

test("blocks revoked agent", () => {
  const state = createDemoState();
  state.agents["agent-rwa-001"].status = "revoked";
  const result = evaluatePolicy(state, action({ amount: 10, idempotencyKey: "revoked-1" }));
  assert.equal(result.reasonCode, ReasonCode.AGENT_REVOKED);
});

test("blocks expired policy", () => {
  const state = createDemoState();
  state.policies["agent-rwa-001"].expiresAt = "2026-01-01T00:00:00.000Z";
  const result = evaluatePolicy(state, action({ amount: 10, idempotencyKey: "expired-1" }), {
    now: "2026-07-03T00:00:00.000Z"
  });
  assert.equal(result.reasonCode, ReasonCode.POLICY_EXPIRED);
});

test("requires approval above threshold", () => {
  const state = createDemoState();
  const result = evaluatePolicy(state, action({ amount: 22, idempotencyKey: "approval-1" }));
  assert.equal(result.verdict, "needs_approval");
  assert.equal(result.reasonCode, ReasonCode.APPROVAL_REQUIRED);
});

test("blocks duplicate idempotency key after receipt write", () => {
  const state = createDemoState();
  applyAllowedAction(state, action({ amount: 10, idempotencyKey: "duplicate-1" }));
  const result = evaluatePolicy(state, action({ amount: 10, idempotencyKey: "duplicate-1" }));
  assert.equal(result.reasonCode, ReasonCode.DUPLICATE_ACTION);
});

function action(overrides = {}) {
  return {
    agentId: "agent-rwa-001",
    serviceId: "svc-rwa-risk",
    actionType: "rwa_report_purchase",
    amount: 10,
    idempotencyKey: "test-key",
    ...overrides
  };
}
