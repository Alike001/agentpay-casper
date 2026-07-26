import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";

const EMPTY_DATA = Object.freeze({ mandates: [], executions: [], approvals: [] });

export class JsonMandateStore {
  constructor(path) {
    this.path = path;
    this.writeQueue = Promise.resolve();
  }

  async initialize(seed = EMPTY_DATA) {
    try {
      await readFile(this.path, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await this.write(seed);
    }
    return this.read();
  }

  async read() {
    const data = JSON.parse(await readFile(this.path, "utf8"));
    return normalizeData(data);
  }

  async listMandates() {
    return (await this.read()).mandates;
  }

  async getMandate(id) {
    return (await this.listMandates()).find((mandate) => mandate.id === id) || null;
  }

  async saveMandate(mandate) {
    return this.update((data) => {
      const index = data.mandates.findIndex((item) => item.id === mandate.id);
      if (index === -1) data.mandates.unshift(mandate);
      else data.mandates[index] = mandate;
      return mandate;
    });
  }

  async listExecutions(mandateId = null) {
    const executions = (await this.read()).executions;
    return mandateId ? executions.filter((item) => item.mandateId === mandateId) : executions;
  }

  async getExecution(id) {
    return (await this.read()).executions.find((item) => item.id === id) || null;
  }

  async saveExecution(execution) {
    return this.update((data) => {
      const sameRecord = data.executions.findIndex((item) => item.id === execution.id);
      if (sameRecord !== -1) {
        data.executions[sameRecord] = execution;
        return execution;
      }
      data.executions.unshift(execution);
      return execution;
    });
  }

  async seenIdempotencyKeys(mandateId) {
    const executions = await this.listExecutions(mandateId);
    return new Set(executions.map((item) => item.idempotencyKey));
  }

  async withMandateLock(mandateId, callback) {
    return this.update(async (data) => applyMandateMutation(data, await callback({
      mandate: structuredClone(data.mandates.find((item) => item.id === mandateId) || null),
      executions: structuredClone(data.executions.filter((item) => item.mandateId === mandateId))
    })));
  }

  async update(mutator) {
    let result;
    this.writeQueue = this.writeQueue.then(async () => {
      const data = await this.read();
      result = await mutator(data);
      await this.write(data);
    });
    await this.writeQueue;
    return result;
  }

  async write(data) {
    await mkdir(dirname(this.path), { recursive: true });
    const temporary = `${this.path}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(normalizeData(data), null, 2)}\n`, { mode: 0o600 });
    await rename(temporary, this.path);
  }
}

export class MemoryMandateStore {
  constructor(seed = EMPTY_DATA) {
    this.data = structuredClone(normalizeData(seed));
    this.mutationQueue = Promise.resolve();
  }

  async initialize() {
    return structuredClone(this.data);
  }

  async read() {
    return structuredClone(this.data);
  }

  async listMandates() {
    return (await this.read()).mandates;
  }

  async getMandate(id) {
    return (await this.listMandates()).find((mandate) => mandate.id === id) || null;
  }

  async saveMandate(mandate) {
    const index = this.data.mandates.findIndex((item) => item.id === mandate.id);
    if (index === -1) this.data.mandates.unshift(structuredClone(mandate));
    else this.data.mandates[index] = structuredClone(mandate);
    return mandate;
  }

  async listExecutions(mandateId = null) {
    const executions = (await this.read()).executions;
    return mandateId ? executions.filter((item) => item.mandateId === mandateId) : executions;
  }

  async getExecution(id) {
    return (await this.read()).executions.find((item) => item.id === id) || null;
  }

  async saveExecution(execution) {
    const sameRecord = this.data.executions.findIndex((item) => item.id === execution.id);
    if (sameRecord !== -1) {
      this.data.executions[sameRecord] = structuredClone(execution);
      return structuredClone(execution);
    }
    this.data.executions.unshift(structuredClone(execution));
    return execution;
  }

  async seenIdempotencyKeys(mandateId) {
    return new Set((await this.listExecutions(mandateId)).map((item) => item.idempotencyKey));
  }

  async withMandateLock(mandateId, callback) {
    let result;
    this.mutationQueue = this.mutationQueue.then(async () => {
      result = await callback({
        mandate: structuredClone(this.data.mandates.find((item) => item.id === mandateId) || null),
        executions: structuredClone(this.data.executions.filter((item) => item.mandateId === mandateId))
      });
      applyMandateMutation(this.data, result);
    });
    await this.mutationQueue;
    return result?.value;
  }
}

export class PostgresMandateStore {
  constructor(connectionString) {
    if (!connectionString) throw new TypeError("A Postgres connection string is required.");
    this.pool = new pg.Pool({ connectionString, max: 4 });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS agentpay_mandates (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS agentpay_executions (
        id TEXT PRIMARY KEY,
        mandate_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS agentpay_executions_mandate_id_created_at_idx
        ON agentpay_executions (mandate_id, created_at DESC);
    `);
    return this.read();
  }

  async read() {
    const [mandates, executions] = await Promise.all([this.listMandates(), this.listExecutions()]);
    return { mandates, executions, approvals: [] };
  }

  async listMandates() {
    const result = await this.pool.query("SELECT payload FROM agentpay_mandates ORDER BY updated_at DESC");
    return result.rows.map((row) => row.payload);
  }

  async getMandate(id) {
    const result = await this.pool.query("SELECT payload FROM agentpay_mandates WHERE id = $1", [id]);
    return result.rows[0]?.payload || null;
  }

  async saveMandate(mandate) {
    await this.pool.query(`
      INSERT INTO agentpay_mandates (id, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `, [mandate.id, JSON.stringify(mandate)]);
    return mandate;
  }

  async listExecutions(mandateId = null) {
    const result = mandateId
      ? await this.pool.query("SELECT payload FROM agentpay_executions WHERE mandate_id = $1 ORDER BY created_at DESC", [mandateId])
      : await this.pool.query("SELECT payload FROM agentpay_executions ORDER BY created_at DESC");
    return result.rows.map((row) => row.payload);
  }

  async getExecution(id) {
    const result = await this.pool.query("SELECT payload FROM agentpay_executions WHERE id = $1", [id]);
    return result.rows[0]?.payload || null;
  }

  async saveExecution(execution) {
    await this.pool.query(`
      INSERT INTO agentpay_executions (id, mandate_id, payload, created_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET mandate_id = EXCLUDED.mandate_id, payload = EXCLUDED.payload
    `, [execution.id, execution.mandateId, JSON.stringify(execution)]);
    return execution;
  }

  async seenIdempotencyKeys(mandateId) {
    return new Set((await this.listExecutions(mandateId)).map((item) => item.idempotencyKey));
  }

  async withMandateLock(mandateId, callback) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const mandateResult = await client.query("SELECT payload FROM agentpay_mandates WHERE id = $1 FOR UPDATE", [mandateId]);
      const executionResult = await client.query("SELECT payload FROM agentpay_executions WHERE mandate_id = $1 FOR UPDATE", [mandateId]);
      const result = await callback({
        mandate: mandateResult.rows[0]?.payload || null,
        executions: executionResult.rows.map((row) => row.payload)
      });
      if (result?.mandate) await upsertMandate(client, result.mandate);
      if (result?.execution) await upsertExecution(client, result.execution);
      await client.query("COMMIT");
      return result?.value;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

function normalizeData(data) {
  return {
    mandates: Array.isArray(data?.mandates) ? data.mandates : [],
    executions: Array.isArray(data?.executions) ? data.executions : [],
    approvals: Array.isArray(data?.approvals) ? data.approvals : []
  };
}

function applyMandateMutation(data, result) {
  if (result?.mandate) {
    const mandateIndex = data.mandates.findIndex((item) => item.id === result.mandate.id);
    if (mandateIndex === -1) data.mandates.unshift(structuredClone(result.mandate));
    else data.mandates[mandateIndex] = structuredClone(result.mandate);
  }
  if (result?.execution) {
    const executionIndex = data.executions.findIndex((item) => item.id === result.execution.id);
    if (executionIndex === -1) data.executions.unshift(structuredClone(result.execution));
    else data.executions[executionIndex] = structuredClone(result.execution);
  }
  return result?.value;
}

async function upsertMandate(client, mandate) {
  await client.query(`
    INSERT INTO agentpay_mandates (id, payload, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
  `, [mandate.id, JSON.stringify(mandate)]);
}

async function upsertExecution(client, execution) {
  await client.query(`
    INSERT INTO agentpay_executions (id, mandate_id, payload, created_at)
    VALUES ($1, $2, $3::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET mandate_id = EXCLUDED.mandate_id, payload = EXCLUDED.payload
  `, [execution.id, execution.mandateId, JSON.stringify(execution)]);
}
