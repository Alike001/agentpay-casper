import assert from "node:assert/strict";
import test from "node:test";
import {
  createGatewayRequest,
  gatewayTrace,
  GatewayRequestStatus,
  transitionGatewayRequest
} from "../packages/gateway/index.js";
import { activateMandate, createMandateDraft, CSPR_MOTES } from "../packages/mandate-engine/index.js";

const NOW = "2026-07-25T12:00:00.000Z";

test("creates an authorized gateway request without claiming settlement", () => {
  const request = createGatewayRequest({
    mandate: activeMandate(),
    action: paidAction(),
    seenIdempotencyKeys: new Set(),
    now: NOW,
    id: "allowed"
  });

  assert.equal(request.status, GatewayRequestStatus.AUTHORIZED);
  assert.equal(request.decision.reasonCode, "ALLOWED");
  assert.equal(request.settlement, null);
  assert.equal(gatewayTrace(request).find((step) => step.label === "x402 settlement").status, "pending");
});

test("blocks an overspend before the x402 settlement step", () => {
  const request = createGatewayRequest({
    mandate: activeMandate(),
    action: paidAction({ amountMotes: (100n * CSPR_MOTES).toString() }),
    seenIdempotencyKeys: new Set(),
    now: NOW,
    id: "blocked"
  });

  assert.equal(request.status, GatewayRequestStatus.BLOCKED);
  assert.equal(request.decision.reasonCode, "AMOUNT_OVER_LIMIT");
  assert.equal(gatewayTrace(request).find((step) => step.label === "x402 settlement").status, "skipped");
  assert.equal(gatewayTrace(request).find((step) => step.label === "Casper proof").status, "skipped");
});

test("requires an explicit lifecycle order after authorization", () => {
  const request = createGatewayRequest({
    mandate: activeMandate(),
    action: paidAction(),
    seenIdempotencyKeys: new Set(),
    now: NOW,
    id: "transition"
  });

  assert.throws(() => transitionGatewayRequest(request, GatewayRequestStatus.PROVEN, "Skip settlement", NOW));
  transitionGatewayRequest(request, GatewayRequestStatus.SETTLEMENT_PENDING, "Signature submitted", NOW);
  transitionGatewayRequest(request, GatewayRequestStatus.SETTLED, "Facilitator settled", NOW);
  transitionGatewayRequest(request, GatewayRequestStatus.DELIVERED, "Merchant returned report", NOW);
  transitionGatewayRequest(request, GatewayRequestStatus.PROVEN, "Casper transaction confirmed", NOW);
  assert.equal(request.status, GatewayRequestStatus.PROVEN);
});

function activeMandate() {
  const draft = createMandateDraft({
    ownerPublicKey: "020390e3201006b059e559fcb2282b277c510259285dcabf2eb6b3f3a77f602ee99d",
    agentAccountHash: "account-hash-3975323bebe4fc7eed16f29262ff7756fb745a00aa3a08f5c36a945bf924b2cb",
    expiresAt: "2026-07-30T12:00:00.000Z",
    maxAmountPerActionMotes: (10n * CSPR_MOTES).toString(),
    dailyBudgetMotes: (50n * CSPR_MOTES).toString(),
    approvalThresholdMotes: (10n * CSPR_MOTES).toString()
  }, { now: NOW });
  return activateMandate(draft, draft.ownerPublicKey, { now: NOW });
}

function paidAction(overrides = {}) {
  return {
    agentId: "agent-rwa-001",
    serviceId: "svc-rwa-risk",
    actionType: "paid_service_call",
    amountMotes: (10n * CSPR_MOTES).toString(),
    idempotencyKey: "gateway-request-1",
    ...overrides
  };
}
