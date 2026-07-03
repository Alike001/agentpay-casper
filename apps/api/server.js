import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { applyAllowedAction, createDemoState, evaluatePolicy } from "../../packages/policy-engine/index.js";
import { handleMcpRequest } from "../mcp-server/tools.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const webRoot = join(root, "apps/web");
const port = Number(process.env.PORT || 4173);
const state = createDemoState(new Date());

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

export const server = createServer(async (request, response) => {
  try {
    if (request.url === "/api/state" && request.method === "GET") {
      return sendJson(response, publicState());
    }

    if (request.url === "/api/simulate" && request.method === "POST") {
      const body = await readJson(request);
      return sendJson(response, evaluatePolicy(state, body));
    }

    if (request.url === "/api/run-demo" && request.method === "POST") {
      const body = await readJson(request);
      const action = {
        agentId: "agent-rwa-001",
        serviceId: "svc-rwa-risk",
        actionType: "rwa_report_purchase",
        amount: body.variant === "blocked" ? 100 : 10,
        idempotencyKey: `demo-${body.variant || "allowed"}-${Date.now()}`
      };
      const result = body.variant === "blocked"
        ? { outcome: evaluatePolicy(state, action), receipt: null }
        : applyAllowedAction(state, action, "hash-rwa-report-low-risk");
      return sendJson(response, result);
    }

    if (request.url === "/mcp" && request.method === "POST") {
      const body = await readJson(request);
      return sendJson(response, handleMcpRequest(state, body));
    }

    return serveStatic(request, response);
  } catch (error) {
    return sendJson(response, { error: error.message }, 500);
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    console.log(`AgentSafe Casper running at http://localhost:${port}`);
  });
}

function publicState() {
  return {
    agents: Object.values(state.agents),
    policies: Object.values(state.policies),
    services: Object.values(state.services),
    receipts: state.receipts,
    spentByAgent: state.spentByAgent
  };
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(webRoot, safePath);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "content-type": mime[extname(filePath)] || "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
