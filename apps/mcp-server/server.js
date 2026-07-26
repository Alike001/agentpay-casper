import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { validateMandate } from "../../packages/mandate-engine/index.js";
import { authorizeGatewayRequest, gatewayTrace } from "../../packages/gateway/index.js";

export function createAgentPayMcpServer({ store, services }) {
  const server = new McpServer({
    name: "agentpay-casper",
    version: "0.2.0"
  });

  server.registerTool("agentpay_list_mandates", {
    description: "List Casper agent spending mandates and their current authority status.",
    inputSchema: {}
  }, async () => mcpResult({ mandates: await store.listMandates() }));

  server.registerTool("agentpay_get_mandate", {
    description: "Get one spending mandate, its canonical policy hash, and deterministic validation checks.",
    inputSchema: {
      mandateId: z.string().min(1).describe("AgentPay mandate identifier")
    }
  }, async ({ mandateId }) => {
    const mandate = await requireMandate(store, mandateId);
    return mcpResult({ mandate, validation: validateMandate(mandate) });
  });

  server.registerTool("agentpay_list_services", {
    description: "List paid API services that can be referenced by a spending mandate.",
    inputSchema: {}
  }, async () => mcpResult({ services }));

  server.registerTool("agentpay_authorize_paid_tool", {
    description: "Create a durable AgentPay authorization request for a paid MCP tool. An allowed request reserves mandate capacity but never signs, settles, or delivers a service response.",
    inputSchema: {
      mandateId: z.string().min(1),
      serviceId: z.string().min(1),
      amountMotes: z.string().regex(/^\d+$/),
      idempotencyKey: z.string().min(1),
      approvalId: z.string().min(1).optional()
    }
  }, async ({ mandateId, ...action }) => {
    const mandate = await requireMandate(store, mandateId);
    const request = await authorizeGatewayRequest(store, {
      mandateId,
      source: "mcp",
      action: {
        ...action,
        agentId: mandate.agentId,
        actionType: "paid_service_call"
      }
    });
    return mcpResult({ mandateId, request, trace: gatewayTrace(request) });
  });

  server.registerTool("agentpay_list_requests", {
    description: "List durable paid-tool authorization requests, their decision codes, and any attached settlement evidence.",
    inputSchema: {
      mandateId: z.string().min(1)
    }
  }, async ({ mandateId }) => {
    const requests = await store.listExecutions(mandateId);
    return mcpResult({ mandateId, requests: requests.map((request) => ({ request, trace: gatewayTrace(request) })) });
  });

  server.registerTool("agentpay_get_request", {
    description: "Inspect one AgentPay paid-tool request, including deterministic decision, settlement state, and Casper proof state.",
    inputSchema: {
      requestId: z.string().min(1).describe("AgentPay gateway request identifier")
    }
  }, async ({ requestId }) => {
    const request = await store.getExecution(requestId);
    if (!request) return mcpError(`Gateway request not found: ${requestId}`);
    return mcpResult({ request, trace: gatewayTrace(request) });
  });

  return server;
}

export async function handleOfficialMcpRequest(request, response, body, dependencies) {
  const mcpServer = createAgentPayMcpServer(dependencies);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(request, response, body);
  } finally {
    await transport.close();
    await mcpServer.close();
  }
}

async function requireMandate(store, mandateId) {
  const mandate = await store.getMandate(mandateId);
  if (!mandate) throw new Error(`Mandate not found: ${mandateId}`);
  return mandate;
}

function mcpResult(structuredContent) {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent
  };
}

function mcpError(message) {
  return {
    content: [{ type: "text", text: message }],
    isError: true
  };
}
