import { NextResponse } from "next/server";
import { query, execute, TABLES } from "@/lib/databricks";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const messages = await query(
      `SELECT * FROM ${TABLES.messages} WHERE session_id = ? ORDER BY created_at ASC`,
      [id],
    );
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Query failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await req.json();
    await execute(
      `UPDATE ${TABLES.sessions} SET title = ?, updated_at = current_timestamp() WHERE id = ?`,
      [body.title, id],
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await execute(`DELETE FROM ${TABLES.messages} WHERE session_id = ?`, [id]);
    await execute(`DELETE FROM ${TABLES.sessions} WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Delete failed" }, { status: 500 });
  }
}
