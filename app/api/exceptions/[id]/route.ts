import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/exceptions/${id}`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const e = await res.json();

  return NextResponse.json({
    id: e.name?.split("/").pop() ?? id,
    runId: e.run?.split("/").pop(),
    automation: e.automation,
    message: e.message,
    description: e.description,
    state: e.state,
    group: e.group?.split("/").pop() ?? "",
    stage: e.stage,
    resolver: e.resolver,
    assignee: e.assignee,
    create_time: e.create_time,
    update_time: e.update_time,
    location: e.location,
  });
}
