import casperSdk from "casper-js-sdk";
import { validateMandate } from "../mandate-engine/index.js";

const { Args, CLValue, ContractCallBuilder, HttpHandler, Key, PublicKey, RpcClient, Transaction } = casperSdk;

export function buildCreateMandateTransaction(mandate, options = {}) {
  const packageHash = normalizePackageHash(options.packageHash || process.env.MANDATE_GUARD_PACKAGE_HASH);
  const validation = validateMandate(mandate, { now: options.now || new Date() });
  if (!validation.valid) {
    const failed = validation.checks.filter((check) => !check.passed).map((check) => check.code);
    throw new TypeError(`Mandate is not contract-ready: ${failed.join(", ")}`);
  }
  if (mandate.allowedServiceIds.length !== 1) {
    throw new TypeError("The current contract transaction supports one initial service; add more services after activation.");
  }

  const runtimeArgs = Args.fromMap({
    mandate_id: CLValue.newCLString(mandate.id),
    agent: CLValue.newCLKey(Key.newKey(mandate.agentAccountHash)),
    agent_id: CLValue.newCLString(mandate.agentId),
    policy_hash: CLValue.newCLString(mandate.policyHash),
    allowed_service_id: CLValue.newCLString(mandate.allowedServiceIds[0]),
    max_amount_per_action: CLValue.newCLUint64(mandate.maxAmountPerActionMotes),
    daily_budget: CLValue.newCLUint64(mandate.dailyBudgetMotes),
    approval_threshold: CLValue.newCLUint64(mandate.approvalThresholdMotes),
    valid_from: CLValue.newCLUint64(new Date(mandate.validFrom).getTime()),
    expires_at: CLValue.newCLUint64(new Date(mandate.expiresAt).getTime())
  });

  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(mandate.ownerPublicKey))
    .byPackageHash(packageHash)
    .entryPoint("create_mandate")
    .runtimeArgs(runtimeArgs)
    .chainName("casper-test")
    .payment(Number(options.paymentMotes || process.env.MANDATE_CALL_PAYMENT_MOTES || 5_000_000_000))
    .build();

  return {
    transaction: transaction.toJSON(),
    signingPublicKey: mandate.ownerPublicKey,
    network: "casper-test",
    contractPackageHash: `hash-${packageHash}`,
    entryPoint: "create_mandate",
    policyHash: mandate.policyHash
  };
}

export function buildRevokeMandateTransaction(mandate, options = {}) {
  const packageHash = normalizePackageHash(options.packageHash || process.env.MANDATE_GUARD_PACKAGE_HASH);
  if (!mandate?.id) throw new TypeError("A mandate ID is required to build a revocation transaction.");
  if (!mandate?.ownerPublicKey || mandate.ownerPublicKey === "wallet-not-connected") {
    throw new TypeError("A connected owner wallet is required to revoke a mandate.");
  }

  const transaction = new ContractCallBuilder()
    .from(PublicKey.fromHex(mandate.ownerPublicKey))
    .byPackageHash(packageHash)
    .entryPoint("revoke_mandate")
    .runtimeArgs(Args.fromMap({ mandate_id: CLValue.newCLString(mandate.id) }))
    .chainName("casper-test")
    .payment(Number(options.paymentMotes || process.env.MANDATE_CALL_PAYMENT_MOTES || 5_000_000_000))
    .build();

  return {
    transaction: transaction.toJSON(),
    signingPublicKey: mandate.ownerPublicKey,
    network: "casper-test",
    contractPackageHash: `hash-${packageHash}`,
    entryPoint: "revoke_mandate",
    mandateId: mandate.id
  };
}

export async function submitCasperWalletSignature(transactionJson, signingPublicKey, signature, options = {}) {
  if (!transactionJson || typeof transactionJson !== "object") {
    throw new TypeError("A stored Casper transaction is required for wallet submission.");
  }
  if (!/^(01|02|03)[a-f0-9]{64,}$/i.test(String(signingPublicKey || ""))) {
    throw new TypeError("A valid Casper signing public key is required.");
  }

  const transaction = Transaction.fromJSON(transactionJson);
  transaction.setSignature(toSignatureBytes(signature), PublicKey.fromHex(signingPublicKey));
  if (!transaction.validate()) throw new TypeError("Casper Wallet signature did not validate against the stored transaction.");

  const nodeUrl = String(options.nodeUrl || process.env.CASPER_NODE_URL || "https://rpc.testnet.casper.network/rpc");
  const client = new RpcClient(new HttpHandler(nodeUrl));
  const submitted = await client.putTransaction(transaction);
  if (!submitted?.transactionHash) throw new Error("Casper node did not return a transaction hash.");
  return { transactionHash: submitted.transactionHash, nodeUrl };
}

function normalizePackageHash(value) {
  const hash = String(value || "").replace(/^(hash-|contract-package-)/, "");
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new TypeError("MANDATE_GUARD_PACKAGE_HASH must be a 64-character Casper package hash.");
  return hash;
}

function toSignatureBytes(value) {
  if (Array.isArray(value) && value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    return Uint8Array.from(value);
  }
  const hex = String(value || "").replace(/^0x/, "");
  if (!hex || hex.length % 2 || !/^[a-f0-9]+$/i.test(hex)) {
    throw new TypeError("Casper Wallet signature must be a byte array or even-length hexadecimal string.");
  }
  return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => Number.parseInt(byte, 16)));
}
