import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${id}/guideEntries`
  );

  if (!res.ok) {
    return NextResponse.json({ guides: [] });
  }

  const data = await res.json();
  const guides = (data.guide_entries ?? []).map(
    (entry: {
      title?: string;
      root_cause?: string;
      resolution_steps?: string;
      resolution_code?: string;
      state?: string;
      create_time?: string;
    }) => ({
      title: entry.title ?? "Untitled guide",
      root_cause: entry.root_cause ?? "",
      resolution_steps: entry.resolution_steps ?? "",
      resolution_code: entry.resolution_code ?? "",
      state: entry.state ?? "UNKNOWN",
      create_time: entry.create_time ?? "",
    })
  );

  return NextResponse.json({ guides });
}
