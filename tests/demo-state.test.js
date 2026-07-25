import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAgentTrace,
  buildAutonomousRun,
  handleRwaRiskReport,
  merchantPaymentChallenge,
  merchantServicesCatalog,
  x402Flow
} from "../apps/api/server.js";

test("builds a visible allowed agent trace", () => {
  const trace = buildAgentTrace(
    { amount: 10 },
    { verdict: "allow", reasonCode: "ALLOWED" },
    { txHash: "testnet-demo-transaction" }
  );

  assert.equal(trace.some((step) => step.label === "MCP tool call"), true);
  assert.equal(trace.find((step) => step.label === "Policy decision").status, "complete");
  assert.equal(trace.find((step) => step.label === "Casper proof").value, "testnet-demo-transaction");
});

test("builds a blocked trace without transaction proof", () => {
  const trace = buildAgentTrace(
    { amount: 100 },
    { verdict: "block", reasonCode: "AMOUNT_OVER_LIMIT" },
    null
  );

  assert.equal(trace.find((step) => step.label === "Policy decision").status, "blocked");
  assert.equal(trace.find((step) => step.label === "Casper proof").value, "No transaction signed");
});

test("documents the official x402 paid API flow", () => {
  const flow = x402Flow();

  assert.equal(flow.length, 4);
  assert.equal(flow.some((step) => step.value.includes("402 Payment Required")), true);
  assert.equal(flow.some((step) => step.value.includes("verified official x402 settlement")), true);
});

test("builds an autonomous agent run from checkout trace", () => {
  const run = buildAutonomousRun(buildAgentTrace(
    { amount: 10 },
    { verdict: "allow", reasonCode: "ALLOWED" },
    { txHash: "testnet-demo-transaction" }
  ));

  assert.equal(run.length, 5);
  assert.deepEqual(run.map((step) => step.phase), ["Perceive", "Request", "Decide", "Act", "Record"]);
  assert.equal(run.find((step) => step.phase === "Decide").status, "complete");
  assert.equal(run.find((step) => step.phase === "Act").output, "testnet-demo-transaction");
});

test("marks autonomous run blocked before payment", () => {
  const run = buildAutonomousRun(buildAgentTrace(
    { amount: 100 },
    { verdict: "block", reasonCode: "AMOUNT_OVER_LIMIT" },
    null
  ));

  assert.equal(run.find((step) => step.phase === "Decide").status, "blocked");
  assert.equal(run.find((step) => step.phase === "Act").status, "blocked");
  assert.equal(run.find((step) => step.phase === "Record").output, "No transaction signed");
});

test("marks the legacy merchant endpoint as retired", () => {
  const challenge = merchantPaymentChallenge();

  assert.equal(challenge.status, 410);
  assert.equal(challenge.serviceId, "svc-rwa-risk");
  assert.equal(challenge.amount, 10);
  assert.equal(challenge.currency, "WCSPR");
  assert.equal(challenge.requiredHeader, "PAYMENT-SIGNATURE");
});

test("exposes a merchant services catalog", () => {
  const catalog = merchantServicesCatalog();

  assert.equal(catalog.merchantId, "merchant-rwa-labs");
  assert.equal(catalog.services.length, 1);
  assert.equal(catalog.services[0].endpoint, "GET /api/x402/rwa-risk-report");
  assert.equal(catalog.services[0].price, 10);
  assert.equal(catalog.services[0].currency, "WCSPR");
});

test("legacy merchant RWA API never accepts a hard-coded receipt header", async () => {
  const challengeResponse = createMockResponse();
  handleRwaRiskReport({ headers: {} }, challengeResponse);
  const challenge = JSON.parse(challengeResponse.body);
  assert.equal(challengeResponse.status, 410);
  assert.equal(challenge.error, "LEGACY_ENDPOINT_RETIRED");
  assert.equal(challenge.serviceId, "svc-rwa-risk");

  const bypassResponse = createMockResponse();
  handleRwaRiskReport({ headers: { "x-agentpay-receipt": "agentpay-demo-approved" } }, bypassResponse);
  const bypass = JSON.parse(bypassResponse.body);
  assert.equal(bypassResponse.status, 410);
  assert.equal(bypass.error, "LEGACY_ENDPOINT_RETIRED");
});

function createMockResponse() {
  return {
    status: 200,
    headers: {},
    body: "",
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    }
  };
}
