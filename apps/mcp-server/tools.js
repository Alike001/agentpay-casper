import { applyAllowedAction, evaluatePolicy } from "../../packages/policy-engine/index.js";

export const toolDefinitions = [
  {
    name: "casper_get_agent_policy",
    description: "Return the active spending policy for an AgentPay Casper buyer agent."
  },
  {
    name: "casper_list_services",
    description: "List paid merchant APIs a buyer agent may request through AgentPay."
  },
  {
    name: "casper_simulate_action",
    description: "Evaluate a proposed action without writing a receipt."
  },
  {
    name: "casper_execute_allowed_action",
    description: "Execute an allowed paid API call and write a receipt-shaped proof."
  },
  {
    name: "casper_write_receipt",
    description: "Write a receipt-shaped proof for a policy-checked action."
  }
];

export function callTool(state, name, args = {}) {
  if (name === "casper_get_agent_policy") {
    return state.policies[args.agentId || "agent-rwa-001"];
  }

  if (name === "casper_list_services") {
    return Object.values(state.services);
  }

  if (name === "casper_simulate_action") {
    return evaluatePolicy(state, args);
  }

  if (name === "casper_execute_allowed_action" || name === "casper_write_receipt") {
    return applyAllowedAction(state, args, args.resultHash || "hash-rwa-report-approved");
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}

export function handleMcpRequest(state, body) {
  if (body.method === "tools/list") {
    return { jsonrpc: "2.0", id: body.id ?? null, result: { tools: toolDefinitions } };
  }

  if (body.method === "tools/call") {
    const name = body.params?.name;
    const args = body.params?.arguments || {};
    return { jsonrpc: "2.0", id: body.id ?? null, result: callTool(state, name, args) };
  }

  return {
    jsonrpc: "2.0",
    id: body.id ?? null,
    error: { code: -32601, message: `Unsupported method: ${body.method}` }
  };
}
