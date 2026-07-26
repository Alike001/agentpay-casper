import assert from "node:assert/strict";
import test from "node:test";
import casperSdk from "casper-js-sdk";
import { createWalletAuthChallenge, createWalletSession, verifyWalletAuthSignature, verifyWalletSession, walletAuthMessage } from "../packages/wallet-auth/index.js";

const { KeyAlgorithm, PrivateKey } = casperSdk;
const SECRET = "test-auth-secret";
const NOW = "2026-07-26T12:00:00.000Z";

test("verifies the exact Casper Wallet signMessage format", () => {
  const privateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
  const challenge = createWalletAuthChallenge(privateKey.publicKey.toHex(), { now: NOW });
  const signature = privateKey.sign(Uint8Array.from(Buffer.from(`Casper Message:\n${walletAuthMessage(challenge)}`)));
  assert.equal(verifyWalletAuthSignature(challenge, signature, { now: NOW }), true);
  assert.equal(verifyWalletAuthSignature({ ...challenge, nonce: "tampered" }, signature, { now: NOW }), false);
});

test("issues signed, expiring owner-scoped wallet sessions", () => {
  const privateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
  const token = createWalletSession(privateKey.publicKey.toHex(), SECRET, { now: NOW });
  assert.equal(verifyWalletSession(token, SECRET, { now: NOW }).sub, privateKey.publicKey.toHex());
  assert.equal(verifyWalletSession(`${token}x`, SECRET, { now: NOW }), null);
  assert.equal(verifyWalletSession(token, SECRET, { now: "2026-07-27T00:00:00.000Z" }), null);
});
