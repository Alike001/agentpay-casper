import assert from "node:assert/strict";
import test from "node:test";
import { buildCreateMandateTransaction, buildRevokeMandateTransaction, classifyCasperTransactionResult, normalizeWalletSignature, submitCasperWalletSignature } from "../packages/casper-transactions/index.js";
import { createMandateDraft } from "../packages/mandate-engine/index.js";

test("builds an unsigned Casper Testnet MandateGuard transaction from validated policy", () => {
  const now = "2026-07-21T12:00:00.000Z";
  const mandate = createMandateDraft({
    ownerPublicKey: "020390e3201006b059e559fcb2282b277c510259285dcabf2eb6b3f3a77f602ee99d",
    agentAccountHash: "account-hash-3975323bebe4fc7eed16f29262ff7756fb745a00aa3a08f5c36a945bf924b2cb",
    expiresAt: "2026-07-28T12:00:00.000Z"
  }, { now });
  const built = buildCreateMandateTransaction(mandate, {
    now,
    packageHash: "a".repeat(64)
  });

  assert.equal(built.entryPoint, "create_mandate");
  assert.equal(built.signingPublicKey, mandate.ownerPublicKey);
  assert.equal(built.network, "casper-test");
  assert.equal(typeof built.transaction, "object");
  assert.equal(built.transaction.payload.fields.entry_point.Custom, "create_mandate");
  assert.deepEqual(built.transaction.approvals, []);
});

test("builds an unsigned owner-signed MandateGuard revocation transaction", () => {
  const mandate = createMandateDraft({
    id: "mandate-to-revoke",
    ownerPublicKey: "020390e3201006b059e559fcb2282b277c510259285dcabf2eb6b3f3a77f602ee99d",
    agentAccountHash: "account-hash-3975323bebe4fc7eed16f29262ff7756fb745a00aa3a08f5c36a945bf924b2cb"
  });
  const built = buildRevokeMandateTransaction(mandate, { packageHash: "b".repeat(64) });

  assert.equal(built.entryPoint, "revoke_mandate");
  assert.equal(built.signingPublicKey, mandate.ownerPublicKey);
  assert.equal(built.network, "casper-test");
  assert.equal(built.transaction.payload.fields.entry_point.Custom, "revoke_mandate");
  assert.deepEqual(built.transaction.approvals, []);
});

test("rejects an invalid Casper Wallet signature before any node submission", async () => {
  const mandate = createMandateDraft({
    ownerPublicKey: "020390e3201006b059e559fcb2282b277c510259285dcabf2eb6b3f3a77f602ee99d",
    agentAccountHash: "account-hash-3975323bebe4fc7eed16f29262ff7756fb745a00aa3a08f5c36a945bf924b2cb",
    expiresAt: "2026-07-28T12:00:00.000Z"
  }, { now: "2026-07-21T12:00:00.000Z" });
  const built = buildCreateMandateTransaction(mandate, { packageHash: "a".repeat(64) });

  await assert.rejects(
    () => submitCasperWalletSignature(built.transaction, mandate.ownerPublicKey, [0]),
    /signature/i
  );
});

test("normalizes a Casper Wallet serialized signature with its matching algorithm tag", () => {
  const tagged = [2, ...Array.from({ length: 64 }, (_value, index) => index)];
  const normalized = normalizeWalletSignature(tagged, "02" + "a".repeat(64));

  assert.deepEqual([...normalized], tagged.slice(1));
  assert.deepEqual([...normalizeWalletSignature(tagged.slice(1), "02" + "a".repeat(64))], tagged.slice(1));
});

test("classifies a successful Casper V2 execution as confirmed", () => {
  const confirmation = classifyCasperTransactionResult({
    execution_info: {
      block_hash: "block-hash",
      execution_result: { Version2: { error_message: null } }
    }
  }, "a".repeat(64), "https://rpc.testnet.casper.network/rpc");

  assert.equal(confirmation.status, "confirmed");
  assert.equal(confirmation.blockHash, "block-hash");
  assert.equal(confirmation.error, null);
});

test("classifies failed and unexecuted Casper transactions without claiming confirmation", () => {
  const failed = classifyCasperTransactionResult({
    execution_info: { execution_result: { Version2: { error_message: "User error: mandate exists" } } }
  }, "b".repeat(64));
  const pending = classifyCasperTransactionResult({ transaction: { hash: "c".repeat(64) } });

  assert.equal(failed.status, "failed");
  assert.match(failed.error, /mandate exists/);
  assert.equal(pending.status, "pending");
});
