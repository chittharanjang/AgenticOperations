import { NextResponse } from "next/server";
import { query, TABLES } from "@/lib/databricks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await query(
      `SELECT * FROM ${TABLES.sessions} ORDER BY updated_at DESC LIMIT 50`,
    );
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO ${TABLES.sessions} (id, user_id, title, created_at, updated_at) VALUES (?, 'default', ?, current_timestamp(), current_timestamp())`,
      [id, ""],
    );
    const rows = await query(
      `SELECT * FROM ${TABLES.sessions} WHERE id = ?`,
      [id],
    );
    return NextResponse.json({ session: rows[0] ?? { id, title: "" } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Insert failed" }, { status: 500 });
  }
}
