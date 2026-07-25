import { randomUUID } from "node:crypto";
import { evaluateMandate } from "../mandate-engine/index.js";

export const GatewayRequestStatus = Object.freeze({
  PROPOSED: "proposed",
  VALIDATED: "validated",
  AUTHORIZED: "authorized",
  APPROVAL_REQUIRED: "approval_required",
  BLOCKED: "blocked",
  SETTLEMENT_PENDING: "settlement_pending",
  SETTLED: "settled",
  DELIVERED: "delivered",
  PROVEN: "proven",
  FAILED: "failed"
});

const TERMINAL_STATUSES = new Set([
  GatewayRequestStatus.BLOCKED,
  GatewayRequestStatus.APPROVAL_REQUIRED,
  GatewayRequestStatus.PROVEN,
  GatewayRequestStatus.FAILED
]);

const ALLOWED_TRANSITIONS = new Map([
  [GatewayRequestStatus.AUTHORIZED, new Set([GatewayRequestStatus.SETTLEMENT_PENDING, GatewayRequestStatus.FAILED])],
  [GatewayRequestStatus.SETTLEMENT_PENDING, new Set([GatewayRequestStatus.SETTLED, GatewayRequestStatus.FAILED])],
  [GatewayRequestStatus.SETTLED, new Set([GatewayRequestStatus.DELIVERED, GatewayRequestStatus.FAILED])],
  [GatewayRequestStatus.DELIVERED, new Set([GatewayRequestStatus.PROVEN, GatewayRequestStatus.FAILED])]
]);

export function createGatewayRequest({ mandate, action, source = "rest", seenIdempotencyKeys, now = new Date(), id = randomUUID() }) {
  const createdAt = asIso(now);
  const decision = evaluateMandate(mandate, action, { now, seenIdempotencyKeys });
  const request = {
    id: `request-${id}`,
    type: "paid_mcp_action",
    source: String(source),
    mandateId: mandate.id,
    agentId: mandate.agentId,
    serviceId: decision.action.serviceId,
    actionType: decision.action.actionType,
    amountMotes: decision.action.amountMotes,
    idempotencyKey: decision.action.idempotencyKey,
    status: GatewayRequestStatus.PROPOSED,
    decision: null,
    settlement: null,
    delivery: null,
    proof: null,
    createdAt,
    updatedAt: createdAt,
    events: [event(GatewayRequestStatus.PROPOSED, "AgentPay received a structured paid-tool action.", createdAt)]
  };

  transitionGatewayRequest(request, GatewayRequestStatus.VALIDATED, "Mandate and action were normalized for deterministic evaluation.", createdAt);

  if (decision.verdict === "allow") {
    transitionGatewayRequest(request, GatewayRequestStatus.AUTHORIZED, decision.message, createdAt, { decision });
  } else if (decision.verdict === "needs_approval") {
    transitionGatewayRequest(request, GatewayRequestStatus.APPROVAL_REQUIRED, decision.message, createdAt, { decision });
  } else {
    transitionGatewayRequest(request, GatewayRequestStatus.BLOCKED, decision.message, createdAt, { decision });
  }

  return request;
}

export function transitionGatewayRequest(request, nextStatus, message, at = new Date(), patch = {}) {
  const timestamp = asIso(at);
  const current = request.status;
  if (TERMINAL_STATUSES.has(current)) {
    throw new Error(`Cannot transition terminal gateway request from ${current}.`);
  }
  if (current === GatewayRequestStatus.PROPOSED && nextStatus !== GatewayRequestStatus.VALIDATED) {
    throw new Error("Gateway requests must be validated before a decision is recorded.");
  }
  if (current === GatewayRequestStatus.VALIDATED && ![
    GatewayRequestStatus.AUTHORIZED,
    GatewayRequestStatus.APPROVAL_REQUIRED,
    GatewayRequestStatus.BLOCKED
  ].includes(nextStatus)) {
    throw new Error("Validated gateway requests require an authorization, approval, or block decision.");
  }
  if (ALLOWED_TRANSITIONS.has(current) && !ALLOWED_TRANSITIONS.get(current).has(nextStatus)) {
    throw new Error(`Invalid gateway request transition from ${current} to ${nextStatus}.`);
  }

  request.status = nextStatus;
  request.updatedAt = timestamp;
  Object.assign(request, patch);
  request.events.push(event(nextStatus, message, timestamp));
  return request;
}

export function gatewayTrace(request) {
  const statuses = new Map(request.events.map((item) => [item.status, item]));
  return [
    traceStep("Proposed", statuses.get(GatewayRequestStatus.PROPOSED), "complete"),
    traceStep("Validated", statuses.get(GatewayRequestStatus.VALIDATED), "complete"),
    traceStep("Mandate decision", statuses.get(request.status === GatewayRequestStatus.BLOCKED ? GatewayRequestStatus.BLOCKED : request.status === GatewayRequestStatus.APPROVAL_REQUIRED ? GatewayRequestStatus.APPROVAL_REQUIRED : GatewayRequestStatus.AUTHORIZED), decisionTraceStatus(request)),
    traceStep("x402 settlement", statuses.get(GatewayRequestStatus.SETTLEMENT_PENDING) || statuses.get(GatewayRequestStatus.SETTLED), settlementTraceStatus(request)),
    traceStep("Service delivery", statuses.get(GatewayRequestStatus.DELIVERED), deliveryTraceStatus(request)),
    traceStep("Casper proof", statuses.get(GatewayRequestStatus.PROVEN), proofTraceStatus(request))
  ];
}

function event(status, message, at) {
  return { status, message, at };
}

function traceStep(label, item, fallbackStatus) {
  return {
    label,
    status: item ? item.status : fallbackStatus,
    message: item?.message || "Not reached.",
    at: item?.at || null
  };
}

function decisionTraceStatus(request) {
  if (request.status === GatewayRequestStatus.BLOCKED) return "blocked";
  if (request.status === GatewayRequestStatus.APPROVAL_REQUIRED) return "approval_required";
  return "authorized";
}

function settlementTraceStatus(request) {
  if ([GatewayRequestStatus.BLOCKED, GatewayRequestStatus.APPROVAL_REQUIRED].includes(request.status)) return "skipped";
  if (request.status === GatewayRequestStatus.FAILED) return "failed";
  if ([GatewayRequestStatus.SETTLED, GatewayRequestStatus.DELIVERED, GatewayRequestStatus.PROVEN].includes(request.status)) return "settled";
  return "pending";
}

function deliveryTraceStatus(request) {
  if ([GatewayRequestStatus.BLOCKED, GatewayRequestStatus.APPROVAL_REQUIRED].includes(request.status)) return "skipped";
  if (request.status === GatewayRequestStatus.FAILED) return "failed";
  return [GatewayRequestStatus.DELIVERED, GatewayRequestStatus.PROVEN].includes(request.status) ? "delivered" : "pending";
}

function proofTraceStatus(request) {
  if ([GatewayRequestStatus.BLOCKED, GatewayRequestStatus.APPROVAL_REQUIRED].includes(request.status)) return "skipped";
  if (request.status === GatewayRequestStatus.FAILED) return "failed";
  return request.status === GatewayRequestStatus.PROVEN ? "proven" : "pending";
}

function asIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("Gateway request timestamp must be a valid date.");
  return date.toISOString();
}
