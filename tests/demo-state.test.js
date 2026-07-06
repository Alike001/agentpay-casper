import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentTrace, x402Flow } from "../apps/api/server.js";

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

test("documents the x402-style paid API flow", () => {
  const flow = x402Flow();

  assert.equal(flow.length, 4);
  assert.equal(flow.some((step) => step.value.includes("402 Payment Required")), true);
  assert.equal(flow.some((step) => step.label.includes("Merchant")), true);
});
