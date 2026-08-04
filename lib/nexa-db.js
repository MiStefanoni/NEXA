import { createClient } from "@libsql/client";

let client;

export function getDatabaseUrl() {
  return process.env.TURSO_DATABASE_URL || "";
}

export function getDatabaseAuthToken() {
  return process.env.TURSO_AUTH_TOKEN || "";
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl() && getDatabaseAuthToken());
}

export function getClient() {
  if (!isDatabaseConfigured()) {
    throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are not configured.");
  }

  if (!client) {
    client = createClient({
      url: getDatabaseUrl(),
      authToken: getDatabaseAuthToken(),
    });
  }

  return client;
}

function normalizeResult(result) {
  return {
    rows: Array.from(result.rows || []),
    rowCount: Number(result.rowsAffected || 0),
  };
}

export async function query(sql, args = []) {
  const result = await getClient().execute({ sql, args });
  return normalizeResult(result);
}

export async function executeMultiple(sql) {
  return getClient().executeMultiple(sql);
}

export async function writeTransaction(callback) {
  const transaction = await getClient().transaction("write");

  try {
    const scopedDb = {
      query: async (sql, args = []) => {
        const result = await transaction.execute({ sql, args });
        return normalizeResult(result);
      },
    };
    const result = await callback(scopedDb);
    await transaction.commit();
    return result;
  } catch (error) {
    if (!transaction.closed) {
      await transaction.rollback().catch(() => {});
    }
    throw error;
  } finally {
    if (!transaction.closed) {
      transaction.close();
    }
  }
}
