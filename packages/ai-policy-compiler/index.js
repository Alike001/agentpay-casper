import OpenAI from "openai";
import { CSPR_MOTES, createMandateDraft, validateMandate } from "../mandate-engine/index.js";

const MANDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    agentName: { type: "string" },
    agentId: { type: "string" },
    allowedServiceIds: { type: "array", items: { type: "string" }, minItems: 1 },
    maxAmountPerActionCSPR: { type: "number", minimum: 0.000000001 },
    dailyBudgetCSPR: { type: "number", minimum: 0.000000001 },
    approvalThresholdCSPR: { type: "number", minimum: 0 },
    durationHours: { type: "integer", minimum: 1, maximum: 720 },
    explanation: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } }
  },
  required: [
    "name",
    "agentName",
    "agentId",
    "allowedServiceIds",
    "maxAmountPerActionCSPR",
    "dailyBudgetCSPR",
    "approvalThresholdCSPR",
    "durationHours",
    "explanation",
    "assumptions"
  ]
};

export async function compileMandateIntent(input, options = {}) {
  const provider = resolveProvider(options, process.env);
  const apiKey = provider === "groq" ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey && !options.client) {
    throw new IntegrationUnavailableError(`${provider === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY"} is not configured.`);
  }

  const intent = String(input.intent || "").trim();
  if (intent.length < 12 || intent.length > 2_000) {
    throw new TypeError("Mandate intent must contain between 12 and 2,000 characters.");
  }

  const now = new Date(options.now || new Date());
  const client = options.client || new OpenAI({
    apiKey,
    ...(provider === "groq" ? { baseURL: "https://api.groq.com/openai/v1" } : {})
  });
  const response = await client.responses.create({
    model: options.model || modelForProvider(provider, process.env),
    store: false,
    instructions: [
      "Compile a human spending intent into a conservative Casper Testnet agent mandate draft.",
      "You only draft constraints; you never authorize, sign, or claim an on-chain action occurred.",
      "Use only service IDs supplied in the request. Amounts are WCSPR values, where one WCSPR uses nine decimal places.",
      "Keep the daily budget at least as large as the per-action maximum and the approval threshold no larger than the per-action maximum.",
      "When the intent is ambiguous, choose lower limits and list the ambiguity in assumptions."
    ].join(" "),
    input: JSON.stringify({
      intent,
      ownerPublicKey: input.ownerPublicKey || "wallet-not-connected",
      agentAccountHash: input.agentAccountHash || "agent-account-not-set",
      availableServices: input.availableServices || [{ id: "svc-rwa-risk", name: "RWA Risk Report API", priceCSPR: 10 }]
    }),
    text: {
      format: {
        type: "json_schema",
        name: "casper_agent_spending_mandate",
        strict: true,
        schema: MANDATE_SCHEMA
      }
    }
  });

  if (!response.output_text) throw new Error("OpenAI returned no mandate draft.");
  const compiled = JSON.parse(response.output_text);
  const expiresAt = new Date(now.getTime() + compiled.durationHours * 60 * 60 * 1000).toISOString();
  const mandate = createMandateDraft({
    id: input.id || `mandate-${crypto.randomUUID()}`,
    name: compiled.name,
    ownerPublicKey: input.ownerPublicKey || "wallet-not-connected",
    agentId: compiled.agentId,
    agentName: compiled.agentName,
    agentAccountHash: input.agentAccountHash || "agent-account-not-set",
    allowedServiceIds: compiled.allowedServiceIds,
    maxAmountPerActionMotes: csprToMotes(compiled.maxAmountPerActionCSPR),
    dailyBudgetMotes: csprToMotes(compiled.dailyBudgetCSPR),
    approvalThresholdMotes: csprToMotes(compiled.approvalThresholdCSPR),
    intent,
    expiresAt
  }, { now });

  return {
    mandate,
    validation: validateMandate(mandate, { now }),
    explanation: compiled.explanation,
    assumptions: compiled.assumptions,
    provenance: {
      provider,
      model: response.model || options.model || modelForProvider(provider, process.env),
      responseId: response.id,
      generatedAt: now.toISOString(),
      authority: "draft_only"
    }
  };
}

function resolveProvider(options, env) {
  if (options.provider === "groq" || options.provider === "openai") return options.provider;
  if (env.AI_PROVIDER === "groq" || env.AI_PROVIDER === "openai") return env.AI_PROVIDER;
  return env.GROQ_API_KEY ? "groq" : "openai";
}

function modelForProvider(provider, env) {
  return provider === "groq"
    ? env.GROQ_MODEL || "openai/gpt-oss-20b"
    : env.OPENAI_MODEL || "gpt-5-mini";
}

export function csprToMotes(value) {
  const text = String(value);
  if (!/^\d+(\.\d{1,9})?$/.test(text)) throw new TypeError(`Invalid WCSPR amount: ${value}`);
  const [whole, fraction = ""] = text.split(".");
  return (BigInt(whole) * CSPR_MOTES + BigInt(fraction.padEnd(9, "0"))).toString();
}

export class IntegrationUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "IntegrationUnavailableError";
    this.statusCode = 503;
  }
}
