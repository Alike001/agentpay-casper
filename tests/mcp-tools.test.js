import assert from "node:assert/strict";
import test from "node:test";
import { createDemoState, ReasonCode } from "../packages/policy-engine/index.js";
import { handleMcpRequest } from "../apps/mcp-server/tools.js";

test("lists MCP tools", () => {
  const response = handleMcpRequest(createDemoState(), {
    jsonrpc: "2.0",
    id: "tools",
    method: "tools/list"
  });
  assert.equal(response.result.tools.some((tool) => tool.name === "casper_simulate_action"), true);
});

test("simulates blocked overspend through MCP", () => {
  const response = handleMcpRequest(createDemoState(), {
    jsonrpc: "2.0",
    id: "simulate",
    method: "tools/call",
    params: {
      name: "casper_simulate_action",
      arguments: {
        agentId: "agent-rwa-001",
        serviceId: "svc-rwa-risk",
        actionType: "rwa_report_purchase",
        amount: 100,
        idempotencyKey: "mcp-over"
      }
    }
  });
  assert.equal(response.result.reasonCode, ReasonCode.AMOUNT_OVER_LIMIT);
});
