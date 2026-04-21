import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${id}`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json({
    id: data.name?.split("/").pop() ?? id,
    display_name: data.display_name ?? "",
    description: data.description ?? "",
    english_code: data.english_code ?? "",
    connections: data.connections ?? [],
  });
}
