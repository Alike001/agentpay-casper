import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { applyAllowedAction, createDemoState, evaluatePolicy } from "../../packages/policy-engine/index.js";
import { handleMcpRequest } from "../mcp-server/tools.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const webRoot = join(root, "apps/web");
const port = Number(process.env.PORT || 4173);
let state = createDemoState(new Date());
const testnetProof = await loadTestnetProof();
let lastTrace = buildAgentTrace();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

export const server = createServer(async (request, response) => {
  try {
    if (request.url === "/healthz" && request.method === "GET") {
      return sendJson(response, { ok: true, service: "agentpay-casper" });
    }

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

      if (!result.receipt) {
        state.receipts.unshift(blockedPaymentEvent(action, result.outcome));
      }

      lastTrace = buildAgentTrace(action, result.outcome, result.receipt);
      return sendJson(response, result);
    }

    if (request.url === "/api/reset" && request.method === "POST") {
      state = createDemoState(new Date());
      lastTrace = buildAgentTrace();
      return sendJson(response, { ok: true, state: publicState() });
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
    console.log(`AgentPay Casper running at http://localhost:${port}`);
  });
}

function publicState() {
  return {
    agents: Object.values(state.agents),
    policies: Object.values(state.policies),
    services: Object.values(state.services),
    receipts: [proofReceipt(), ...state.receipts].filter(Boolean),
    spentByAgent: state.spentByAgent,
    agentTrace: lastTrace,
    x402Flow: x402Flow(),
    testnetProof
  };
}

async function loadTestnetProof() {
  try {
    const proofPath = join(root, "proof/testnet-proof.json");
    return JSON.parse(await readFile(proofPath, "utf8"));
  } catch {
    return null;
  }
}

function proofReceipt() {
  if (!testnetProof) return null;
  const receiptTx = testnetProof.transactions.receiptWritten;
  const action = testnetProof.demoAction;
  return {
    id: testnetProof.stateProof.lastReceiptId,
    agentId: action.agentId,
    serviceId: action.serviceId,
    actionType: "rwa_report_purchase",
    amount: Number(action.amount) / 1_000_000_000,
    currency: "CSPR",
    policyHash: action.policyHash,
    actionHash: action.actionHash,
    resultHash: action.resultHash,
    status: "recorded",
    txHash: receiptTx.hash,
    explorerUrl: receiptTx.explorerUrl,
    createdAt: testnetProof.generatedAt
  };
}

export function buildAgentTrace(action = null, outcome = null, receipt = null) {
  const decision = outcome?.reasonCode || "Waiting";
  const verdict = outcome?.verdict || "idle";
  const amount = action?.amount ? `${action.amount} CSPR` : "12.5 CSPR demo receipt";
  const receiptLabel = receipt
    ? receipt.txHash
    : testnetProof?.transactions?.receiptWritten?.hash || "No transaction yet";

  return [
    {
      label: "Buyer agent request",
      value: action ? `Call paid RWA API for ${amount}` : "Call paid RWA Risk Report API",
      status: action ? "complete" : "ready"
    },
    {
      label: "MCP tool call",
      value: "casper_simulate_action",
      status: action ? "complete" : "ready"
    },
    {
      label: "Policy decision",
      value: `${verdict.toUpperCase()} · ${decision}`,
      status: verdict === "block" ? "blocked" : verdict === "allow" ? "complete" : "ready"
    },
    {
      label: "x402 payment route",
      value: "HTTP 402 paid API request gated before signing",
      status: verdict === "block" ? "blocked" : action ? "complete" : "ready"
    },
    {
      label: "Casper proof",
      value: verdict === "block" ? "No transaction signed" : receiptLabel,
      status: verdict === "block" ? "blocked" : receipt ? "complete" : "ready"
    }
  ];
}

export function x402Flow() {
  return [
    {
      label: "1. Buyer agent requests API",
      value: "GET /rwa-risk-report"
    },
    {
      label: "2. Merchant requires payment",
      value: "402 Payment Required · 10 CSPR"
    },
    {
      label: "3. AgentPay checks policy",
      value: "Allowlist, cap, budget, approval, idempotency"
    },
    {
      label: "4. Casper receipt is committed",
      value: "Approved action maps to Casper ReceiptLedger proof"
    }
  ];
}

function blockedPaymentEvent(action, outcome) {
  return {
    id: `blocked-${Date.now()}`,
    agentId: action.agentId,
    serviceId: action.serviceId,
    actionType: action.actionType,
    amount: action.amount,
    policyHash: state.policies[action.agentId]?.policyHash || "unknown-policy",
    actionHash: "blocked-before-payment",
    resultHash: outcome.reasonCode,
    status: "blocked",
    txHash: outcome.reasonCode,
    createdAt: new Date().toISOString()
  };
}

async function serveStatic(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const routeMap = {
    "/": "/index.html",
    "/landing": "/index.html",
    "/dashboard": "/dashboard.html",
    "/console": "/dashboard.html"
  };
  const requestedPath = routeMap[url.pathname] || url.pathname;
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
