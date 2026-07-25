import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { compileMandateIntent, csprToMotes } from "../../packages/ai-policy-compiler/index.js";
import { createCasperX402Middleware } from "../../packages/casper-x402/index.js";
import { buildCreateMandateTransaction, buildRevokeMandateTransaction, submitCasperWalletSignature } from "../../packages/casper-transactions/index.js";
import { DEFAULT_MANDATE_GUARD_PACKAGE_HASH, loadLocalEnvironment, publicRuntimeConfig } from "../../packages/config/index.js";
import {
  canonicalPolicy,
  createMandateDraft,
  evaluateMandate,
  MandateStatus,
  validateMandate
} from "../../packages/mandate-engine/index.js";
import { JsonMandateStore } from "../../packages/mandate-store/index.js";
import { createGatewayRequest, gatewayTrace } from "../../packages/gateway/index.js";
import { handleOfficialMcpRequest } from "../mcp-server/server.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
loadLocalEnvironment(root);
process.env.MANDATE_GUARD_PACKAGE_HASH ||= DEFAULT_MANDATE_GUARD_PACKAGE_HASH;
const webRoot = join(root, "apps/web");
const port = Number(process.env.PORT || 4173);
const testnetProof = await loadProof("testnet-proof.json");
const mandateGuardProof = await loadProof("mandate-guard-testnet-proof.json");
if (!process.env.RECEIPT_LEDGER_PACKAGE_HASH && testnetProof?.contracts?.receiptLedger?.packageHash) {
  process.env.RECEIPT_LEDGER_PACKAGE_HASH = testnetProof.contracts.receiptLedger.packageHash;
}
const productStore = new JsonMandateStore(process.env.AGENTPAY_DATA_FILE || join(root, ".data/agentpay.json"));
let storeInitialization;
const ensureStore = () => storeInitialization ||= productStore.initialize();
const app = express();
const x402 = createCasperX402Middleware();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/healthz", asyncRoute(async (_request, response) => {
  await ensureStore();
  response.json({ ok: true, service: "agentpay-casper", version: "0.2.0" });
}));

app.get("/api/config", (_request, response) => response.json(publicRuntimeConfig()));
app.get("/runtime-config.js", (_request, response) => {
  const config = JSON.stringify(publicRuntimeConfig()).replace(/</g, "\\u003c");
  response.type("text/javascript").send([
    `window.AGENTPAY_CONFIG = ${config};`,
    "const clickUIOptions = { uiContainer: 'csprclick-ui', rootAppElement: '#app', showTopBar: false, defaultTheme: 'light' };",
    "const clickSDKOptions = { appName: 'AgentPay Casper', appId: window.AGENTPAY_CONFIG.csprClickAppId || 'csprclick-template', chainName: 'casper-test', casperNode: 'https://rpc.testnet.casper.network/rpc', providers: ['casper-wallet', 'ledger', 'metamask-snap'] };"
  ].join("\n"));
});
app.get("/api/state", (_request, response) => response.json(publicState()));
app.get("/api/rwa-risk-report", handleRwaRiskReport);
app.get("/api/merchant/services", (_request, response) => response.json(merchantServicesCatalog()));

app.get("/api/mandates", asyncRoute(async (_request, response) => {
  await ensureStore();
  const mandates = await productStore.listMandates();
  response.json({ mandates: mandates.map(withValidation) });
}));

app.get("/api/mandates/:mandateId", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  response.json(withValidation(mandate));
}));

app.post("/api/mandates", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = createMandateDraft(mandateInputFromRequest(request.body));
  await productStore.saveMandate(mandate);
  response.status(201).json(withValidation(mandate));
}));

app.post("/api/mandates/compile", asyncRoute(async (request, response) => {
  await ensureStore();
  const result = await compileMandateIntent({
    ...request.body,
    availableServices: merchantServicesCatalog().services.map((service) => ({
      id: service.id,
      name: service.name,
      priceCSPR: service.price
    }))
  });
  await productStore.saveMandate(result.mandate);
  response.status(201).json(result);
}));

app.post("/api/mandates/:mandateId/requests", createGatewayRequestHandler);
app.post("/api/mandates/:mandateId/evaluate", (request, response, next) => {
  response.set("deprecation", "true");
  response.set("link", `</api/mandates/${request.params.mandateId}/requests>; rel=\"successor-version\"`);
  return createGatewayRequestHandler(request, response, next);
});

app.get("/api/mandates/:mandateId/requests", asyncRoute(async (request, response) => {
  await ensureStore();
  const requests = await productStore.listExecutions(request.params.mandateId);
  response.json({ requests: requests.map(withGatewayTrace) });
}));

app.get("/api/mandates/:mandateId/requests/:requestId", asyncRoute(async (request, response) => {
  await ensureStore();
  const gatewayRequest = await productStore.getExecution(request.params.requestId);
  if (!gatewayRequest || gatewayRequest.mandateId !== request.params.mandateId) {
    throw httpError(404, "Gateway request not found.");
  }
  response.json(withGatewayTrace(gatewayRequest));
}));

app.get("/api/mandates/:mandateId/executions", asyncRoute(async (request, response) => {
  await ensureStore();
  const requests = await productStore.listExecutions(request.params.mandateId);
  response.json({ executions: requests.map(withGatewayTrace) });
}));

async function createGatewayRequestHandler(request, response) {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  const seenIdempotencyKeys = await productStore.seenIdempotencyKeys(mandate.id);
  const gatewayRequest = createGatewayRequest({
    mandate,
    source: request.body.source || "rest",
    seenIdempotencyKeys,
    action: {
      agentId: mandate.agentId,
      serviceId: request.body.serviceId,
      actionType: request.body.actionType || "paid_service_call",
      amountMotes: request.body.amountMotes ?? csprToMotes(request.body.amountCSPR),
      idempotencyKey: request.body.idempotencyKey,
      approvalId: request.body.approvalId
    }
  });
  await productStore.saveExecution(gatewayRequest);
  response.status(201).json(withGatewayTrace(gatewayRequest));
}

app.post("/api/mandates/:mandateId/activation-submissions", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  if (!request.body.transactionHash) throw httpError(400, "A Casper transaction hash is required.");
  const pending = {
    ...mandate,
    status: MandateStatus.PENDING,
    ownerPublicKey: String(request.body.ownerPublicKey || mandate.ownerPublicKey),
    activation: {
      status: "submitted",
      transactionHash: String(request.body.transactionHash),
      submittedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  await productStore.saveMandate(pending);
  response.status(202).json({
    mandate: withValidation(pending),
    message: "Activation submitted. Authority remains pending until Casper confirmation is verified."
  });
}));

app.post("/api/mandates/:mandateId/transactions/activate", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  if (request.body.ownerPublicKey && request.body.ownerPublicKey !== mandate.ownerPublicKey) {
    throw httpError(403, "Connected wallet does not own this mandate draft.");
  }
  response.json(await rememberPendingWalletTransaction(mandate, "activate"));
}));

app.post("/api/mandates/:mandateId/transactions/revoke", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  if (mandate.status !== MandateStatus.ACTIVE) {
    throw httpError(409, "Only a confirmed active mandate can be revoked.");
  }
  if (request.body.ownerPublicKey && request.body.ownerPublicKey !== mandate.ownerPublicKey) {
    throw httpError(403, "Connected wallet does not own this mandate.");
  }
  response.json(await rememberPendingWalletTransaction(mandate, "revoke"));
}));

app.post("/api/mandates/:mandateId/wallet-submissions/:operation", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  const operation = String(request.params.operation);
  if (!["activate", "revoke"].includes(operation)) throw httpError(404, "Unknown wallet operation.");
  if (operation === "revoke" && mandate.status !== MandateStatus.ACTIVE) {
    throw httpError(409, "Only a confirmed active mandate can be revoked.");
  }
  if (request.body.ownerPublicKey && request.body.ownerPublicKey !== mandate.ownerPublicKey) {
    throw httpError(403, "Connected wallet does not own this mandate.");
  }
  const pending = mandate.pendingWalletTransaction;
  if (!pending || pending.operation !== operation || !pending.transaction || !pending.signingPublicKey) {
    throw httpError(409, "Build a fresh wallet transaction before submitting its signature.");
  }
  const submitted = await submitCasperWalletSignature(pending.transaction, pending.signingPublicKey, request.body.signature);
  const updated = recordWalletSubmission(mandate, operation, submitted.transactionHash);
  await productStore.saveMandate(updated);
  response.status(202).json({
    mandate: withValidation(updated),
    transactionHash: submitted.transactionHash,
    message: `${operation === "activate" ? "Activation" : "Revocation"} submitted. AgentPay is waiting for Casper confirmation.`
  });
}));

app.post("/api/mandates/:mandateId/revocation-submissions", asyncRoute(async (request, response) => {
  await ensureStore();
  const mandate = await requireMandate(request.params.mandateId);
  if (mandate.status !== MandateStatus.ACTIVE) {
    throw httpError(409, "Only a confirmed active mandate can be revoked.");
  }
  if (!request.body.transactionHash) throw httpError(400, "A Casper transaction hash is required.");
  const pending = {
    ...mandate,
    revocation: {
      status: "submitted",
      transactionHash: String(request.body.transactionHash),
      submittedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  await productStore.saveMandate(pending);
  response.status(202).json({
    mandate: withValidation(pending),
    message: "Revocation submitted. Authority remains active until Casper confirmation is verified."
  });
}));

app.post("/mcp", asyncRoute(async (request, response) => {
  await ensureStore();
  await handleOfficialMcpRequest(request, response, request.body, {
    store: productStore,
    services: merchantServicesCatalog().services
  });
}));
app.get("/mcp", (_request, response) => response.status(405).json(mcpMethodNotAllowed()));
app.delete("/mcp", (_request, response) => response.status(405).json(mcpMethodNotAllowed()));

if (x402.configured) app.use(x402.middleware);
app.get("/api/x402/rwa-risk-report", (request, response) => {
  if (!x402.configured) {
    return response.status(503).json({
      error: "X402_NOT_CONFIGURED",
      message: "Casper x402 settlement requires facilitator, payee, and WCSPR asset configuration."
    });
  }
  return response.json(paidRwaRiskReport(request.headers["payment-response"] || null));
});

app.get(["/", "/landing"], (_request, response) => response.sendFile(join(webRoot, "index.html")));
app.get(["/dashboard", "/console"], (_request, response) => response.sendFile(join(webRoot, "dashboard.html")));
app.use(express.static(webRoot, { index: false, fallthrough: true }));
app.use((_request, response) => response.status(404).json({ error: "NOT_FOUND" }));
app.use((error, _request, response, _next) => {
  const status = Number(error.statusCode || error.status || 500);
  response.status(status).json({
    error: error.name || "Error",
    message: status >= 500 ? "The request could not be completed." : error.message
  });
});

export const server = createServer(app);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    console.log(`AgentPay Casper running at http://localhost:${port}`);
  });
}

function publicState() {
  return {
    agents: [],
    policies: [],
    services: merchantServicesCatalog().services,
    receipts: [proofReceipt()].filter(Boolean),
    spentByAgent: {},
    agentTrace: [],
    autonomousRun: [],
    x402Flow: x402Flow(),
    merchantApi: merchantApiPreview(),
    merchantServices: merchantServicesCatalog(),
    testnetProof,
    mandateGuardProof
  };
}

async function loadProof(filename) {
  try {
    const proofPath = join(root, "proof", filename);
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
  const amount = action?.amount ? `${action.amount} WCSPR` : "No payment request yet";
  const receiptLabel = receipt?.txHash || "Settlement has not been verified";

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
      value: "GET /api/x402/rwa-risk-report"
    },
    {
      label: "2. Merchant requires payment",
      value: "402 Payment Required · 10 WCSPR"
    },
    {
      label: "3. AgentPay authorizes mandate",
      value: "Allowlist, cap, budget, approval, idempotency"
    },
    {
      label: "4. Facilitator settles and proof attaches",
      value: "Only a verified official x402 settlement unlocks the report"
    }
  ];
}

export function buildAutonomousRun(trace = buildAgentTrace()) {
  const policyStep = trace.find((step) => step.label === "Policy decision") || {};
  const proofStep = trace.find((step) => step.label === "Casper proof") || {};
  const isBlocked = policyStep.status === "blocked";
  const isComplete = policyStep.status === "complete";

  return [
    {
      phase: "Perceive",
      action: "Buyer agent receives task to purchase RWA risk data.",
      tool: "merchant catalog",
      output: "svc-rwa-risk · 10 WCSPR",
      status: "complete"
    },
    {
      phase: "Request",
      action: "Agent calls the official paid merchant endpoint.",
      tool: "GET /api/x402/rwa-risk-report",
      output: "HTTP 402 Payment Required",
      status: "complete"
    },
    {
      phase: "Decide",
      action: "Agent routes payment intent through policy before spending.",
      tool: "casper_simulate_action",
      output: policyStep.value || "Waiting for policy check",
      status: isBlocked ? "blocked" : isComplete ? "complete" : "ready"
    },
    {
      phase: "Act",
      action: isBlocked ? "Unsafe payment is stopped before signing." : "Authorized payment waits for a real x402 signature and facilitator settlement.",
      tool: "PAYMENT-SIGNATURE",
      output: proofStep.value || "Waiting for verified settlement",
      status: isBlocked ? "blocked" : isComplete ? "complete" : "ready"
    },
    {
      phase: "Record",
      action: isBlocked ? "No Casper transaction is produced for blocked spend." : "Casper proof attaches only after the transaction is confirmed.",
      tool: "Casper Testnet",
      output: isBlocked ? "No transaction signed" : "Waiting for Testnet proof",
      status: isBlocked ? "blocked" : "ready"
    }
  ];
}

export function merchantPaymentChallenge() {
  return {
    error: "LEGACY_ENDPOINT_RETIRED",
    status: 410,
    message: "Use the official Casper x402 resource endpoint for paid RWA reports.",
    serviceId: "svc-rwa-risk",
    endpoint: "GET /api/x402/rwa-risk-report",
    amount: 10,
    currency: "WCSPR",
    network: "casper:casper-test",
    paymentRail: "x402 exact",
    requiredHeader: "PAYMENT-SIGNATURE",
    settlementStatus: x402.configured ? "configured" : "not_configured",
    policyGateway: "/mcp",
    proofUrl: testnetProof?.transactions?.receiptWritten?.explorerUrl || null
  };
}

export function merchantServicesCatalog() {
  return {
    merchantId: "merchant-rwa-labs",
    merchantName: "RWA Labs",
    network: "casper:casper-test",
    paymentRail: "x402 exact",
    policyGateway: "/mcp",
    services: [
      {
        id: "svc-rwa-risk",
        name: "RWA Risk Report API",
        description: "Risk score and eligibility summary for agent-purchased RWA invoice data.",
        endpoint: "GET /api/x402/rwa-risk-report",
        price: 10,
        currency: "WCSPR",
        requiredHeader: "PAYMENT-SIGNATURE",
        status: x402.configured ? "active" : "settlement_configuration_required",
        settlementRail: "official Casper x402"
      }
    ]
  };
}

function merchantApiPreview() {
  return {
    endpoint: "GET /api/x402/rwa-risk-report",
    status: x402.configured ? 402 : 503,
    serviceId: "svc-rwa-risk",
    price: "10 WCSPR",
    challenge: merchantPaymentChallenge(),
    catalog: "/api/merchant/services"
  };
}

export function handleRwaRiskReport(request, response) {
  response.writeHead(410, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(merchantPaymentChallenge(), null, 2));
}

function mandateInputFromRequest(body = {}) {
  return {
    id: body.id || `mandate-${crypto.randomUUID()}`,
    name: body.name,
    ownerPublicKey: body.ownerPublicKey,
    agentId: body.agentId,
    agentName: body.agentName,
    agentAccountHash: body.agentAccountHash,
    allowedServiceIds: body.allowedServiceIds,
    maxAmountPerActionMotes: body.maxAmountPerActionMotes || csprToMotes(body.maxAmountPerActionCSPR ?? 10),
    dailyBudgetMotes: body.dailyBudgetMotes || csprToMotes(body.dailyBudgetCSPR ?? 50),
    approvalThresholdMotes: body.approvalThresholdMotes || csprToMotes(body.approvalThresholdCSPR ?? 10),
    expiresAt: body.expiresAt,
    intent: body.intent,
    status: MandateStatus.DRAFT
  };
}

function withValidation(mandate) {
  return { mandate, canonicalPolicy: canonicalPolicy(mandate), validation: validateMandate(mandate) };
}

function withGatewayTrace(gatewayRequest) {
  return { request: gatewayRequest, trace: gatewayTrace(gatewayRequest) };
}

async function rememberPendingWalletTransaction(mandate, operation) {
  const built = operation === "activate"
    ? buildCreateMandateTransaction(mandate)
    : buildRevokeMandateTransaction(mandate);
  const updated = {
    ...mandate,
    pendingWalletTransaction: {
      operation,
      transaction: built.transaction,
      signingPublicKey: built.signingPublicKey,
      entryPoint: built.entryPoint,
      createdAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };
  await productStore.saveMandate(updated);
  return built;
}

function recordWalletSubmission(mandate, operation, transactionHash) {
  const submittedAt = new Date().toISOString();
  const updated = {
    ...mandate,
    pendingWalletTransaction: null,
    updatedAt: submittedAt
  };
  if (operation === "activate") {
    updated.status = MandateStatus.PENDING;
    updated.activation = { status: "submitted", transactionHash, submittedAt };
  } else {
    updated.revocation = { status: "submitted", transactionHash, submittedAt };
  }
  return updated;
}

async function requireMandate(id) {
  const mandate = await productStore.getMandate(id);
  if (!mandate) throw httpError(404, `Mandate not found: ${id}`);
  return mandate;
}

function paidRwaRiskReport(paymentResponse) {
  return {
    serviceId: "svc-rwa-risk",
    reportId: `rwa-report-${Date.now()}`,
    rating: "LOW_RISK",
    confidence: 0.92,
    settlementRail: "x402 exact on Casper",
    paymentResponse,
    generatedAt: new Date().toISOString()
  };
}

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mcpMethodNotAllowed() {
  return {
    jsonrpc: "2.0",
    id: null,
    error: { code: -32000, message: "Method not allowed. Use POST for stateless Streamable HTTP." }
  };
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}
