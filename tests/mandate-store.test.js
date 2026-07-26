import assert from "node:assert/strict";
import test from "node:test";
import { MemoryMandateStore } from "../packages/mandate-store/index.js";

test("mandate store updates mandates and retains duplicate attempts for the audit trail", async () => {
  const store = new MemoryMandateStore();
  await store.initialize();
  await store.saveMandate({ id: "mandate-1", status: "draft" });
  await store.saveMandate({ id: "mandate-1", status: "active" });

  const first = { id: "run-1", mandateId: "mandate-1", idempotencyKey: "action-1" };
  const duplicate = { id: "run-2", mandateId: "mandate-1", idempotencyKey: "action-1" };
  await store.saveExecution(first);
  await store.saveExecution(duplicate);

  assert.equal((await store.listMandates())[0].status, "active");
  assert.equal((await store.listExecutions("mandate-1")).length, 2);
});

test("mandate store updates the same request record through its lifecycle", async () => {
  const store = new MemoryMandateStore();
  await store.initialize();
  await store.saveExecution({ id: "request-1", mandateId: "mandate-1", idempotencyKey: "action-1", status: "authorized" });
  await store.saveExecution({ id: "request-1", mandateId: "mandate-1", idempotencyKey: "action-1", status: "settlement_pending" });

  assert.equal((await store.getExecution("request-1")).status, "settlement_pending");
  assert.equal((await store.listExecutions("mandate-1")).length, 1);
});

test("mandate store consumes each wallet-authentication challenge once", async () => {
  const store = new MemoryMandateStore();
  await store.saveAuthChallenge({ id: "auth-1", publicKey: "01owner", expiresAt: "2026-07-27T12:00:00.000Z" });
  assert.equal((await store.consumeAuthChallenge("auth-1", "01owner", new Date("2026-07-26T12:00:00.000Z"))).id, "auth-1");
  assert.equal(await store.consumeAuthChallenge("auth-1", "01owner", new Date("2026-07-26T12:00:01.000Z")), null);
});
