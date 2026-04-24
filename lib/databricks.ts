const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN;
const DATABRICKS_WAREHOUSE_ID = process.env.DATABRICKS_WAREHOUSE_ID;

const isConfigured = !!(DATABRICKS_HOST && DATABRICKS_TOKEN && DATABRICKS_WAREHOUSE_ID);

if (!isConfigured) {
  console.warn("Databricks credentials missing — chat persistence disabled");
}

export const TABLES = {
  sessions: "chat_sessions",
  messages: "chat_messages",
} as const;

interface StatementResponse {
  status: { state: string };
  manifest?: { schema?: { columns?: Array<{ name: string }> } };
  result?: { data_array?: unknown[][] };
  statement_id?: string;
}

/**
 * Execute a SQL statement against the Databricks SQL Warehouse.
 * Uses the Statement Execution API (/api/2.0/sql/statements).
 * Returns rows as an array of plain objects keyed by column name.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  if (!isConfigured) return [];

  const body: Record<string, unknown> = {
    warehouse_id: DATABRICKS_WAREHOUSE_ID,
    statement: params ? interpolateParams(sql, params) : sql,
    wait_timeout: "30s",
    disposition: "INLINE",
    format: "JSON_ARRAY",
  };

  const res = await fetch(`${DATABRICKS_HOST}/api/2.0/sql/statements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DATABRICKS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Databricks query failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data: StatementResponse = await res.json();

  if (data.status.state === "FAILED") {
    throw new Error(`Databricks statement failed: ${JSON.stringify(data.status)}`);
  }

  const columns = data.manifest?.schema?.columns?.map((c) => c.name) ?? [];
  const rows = data.result?.data_array ?? [];

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

/**
 * Execute a SQL statement that doesn't return rows (INSERT, UPDATE, DELETE).
 * Returns the number of affected rows when available.
 */
export async function execute(sql: string, params?: unknown[]): Promise<void> {
  if (!isConfigured) return;
  await query(sql, params);
}

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function interpolateParams(sql: string, params: unknown[]): string {
  let idx = 0;
  return sql.replace(/\?/g, () => {
    if (idx >= params.length) throw new Error("Not enough parameters for query placeholders");
    return escapeValue(params[idx++]);
  });
}
