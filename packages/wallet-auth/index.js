import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import casperSdk from "casper-js-sdk";

const { PublicKey } = casperSdk;
const CASPER_MESSAGE_HEADER = "Casper Message:\n";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function createWalletAuthChallenge(publicKey, options = {}) {
  const now = asDate(options.now || new Date());
  const normalizedPublicKey = normalizePublicKey(publicKey);
  const challenge = {
    id: `auth-${randomUUID()}`,
    publicKey: normalizedPublicKey,
    nonce: randomBytes(24).toString("hex"),
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS).toISOString()
  };
  return { ...challenge, message: walletAuthMessage(challenge) };
}

export function walletAuthMessage(challenge) {
  return [
    "AgentPay Casper wallet authentication",
    "Network: casper-test",
    `Public key: ${challenge.publicKey}`,
    `Challenge: ${challenge.id}`,
    `Nonce: ${challenge.nonce}`,
    `Expires: ${challenge.expiresAt}`,
    "This signature authorizes this browser session only. It does not create a blockchain transaction."
  ].join("\n");
}

export function verifyWalletAuthSignature(challenge, signature, options = {}) {
  const now = asDate(options.now || new Date());
  if (asDate(challenge.expiresAt) <= now) return false;
  const publicKey = PublicKey.fromHex(normalizePublicKey(challenge.publicKey));
  const rawSignature = signatureBytes(signature);
  const taggedSignature = Uint8Array.from([Number.parseInt(challenge.publicKey.slice(0, 2), 16), ...rawSignature]);
  try {
    return publicKey.verifySignature(messageBytes(walletAuthMessage(challenge)), taggedSignature);
  } catch {
    return false;
  }
}

export function createWalletSession(publicKey, secret, options = {}) {
  const now = asDate(options.now || new Date());
  const payload = {
    sub: normalizePublicKey(publicKey),
    iat: now.getTime(),
    exp: now.getTime() + SESSION_TTL_MS,
    jti: randomUUID()
  };
  const encoded = encodeJson(payload);
  return `aps1.${encoded}.${sign(encoded, secret)}`;
}

export function verifyWalletSession(token, secret, options = {}) {
  const now = asDate(options.now || new Date());
  const [version, encoded, providedSignature, ...rest] = String(token || "").split(".");
  if (version !== "aps1" || !encoded || !providedSignature || rest.length) return null;
  const expectedSignature = sign(encoded, secret);
  if (!safeEqual(providedSignature, expectedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.sub || !Number.isFinite(payload.exp) || payload.exp <= now.getTime()) return null;
    return { ...payload, sub: normalizePublicKey(payload.sub) };
  } catch {
    return null;
  }
}

function messageBytes(message) {
  return Uint8Array.from(Buffer.from(`${CASPER_MESSAGE_HEADER}${message}`, "utf8"));
}

function signatureBytes(signature) {
  if (signature instanceof Uint8Array) return signature;
  if (Array.isArray(signature) && signature.every((value) => Number.isInteger(value) && value >= 0 && value <= 255)) {
    return Uint8Array.from(signature);
  }
  const hex = String(signature || "").replace(/^0x/, "");
  if (!hex || hex.length % 2 || !/^[a-f0-9]+$/i.test(hex)) throw new TypeError("Wallet authentication signature must be bytes or hexadecimal.");
  return Uint8Array.from(hex.match(/.{1,2}/g).map((value) => Number.parseInt(value, 16)));
}

function normalizePublicKey(value) {
  const publicKey = String(value || "").toLowerCase();
  if (!/^(01|02|03)[a-f0-9]{64,}$/i.test(publicKey)) throw new TypeError("A valid Casper public key is required.");
  return publicKey;
}

function sign(value, secret) {
  if (!secret) throw new TypeError("An AgentPay authentication secret is required.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function safeEqual(left, right) {
  const first = Buffer.from(left);
  const second = Buffer.from(right);
  return first.length === second.length && timingSafeEqual(first, second);
}

function asDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("Authentication timestamp must be a valid date.");
  return date;
}
