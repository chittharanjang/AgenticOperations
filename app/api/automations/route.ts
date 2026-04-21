import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations?pageSize=50`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const automations = (data.automations ?? []).map(
    (a: { name: string; display_name: string; description?: string; english_code?: string }) => ({
      id: a.name.split("/").pop(),
      display_name: a.display_name,
      description: a.description ?? "",
      english_code: a.english_code?.slice(0, 500) ?? "",
    })
  );

  return NextResponse.json({ automations });
}
