import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID, APP_URL } from "@/lib/kognitos";
import { getAutomationById } from "@/lib/automations";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/exceptions?pageSize=100`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const exceptions = (data.exceptions ?? []).map(
    (e: {
      name: string;
      run: string;
      message: string;
      description: string;
      state: string;
      create_time: string;
      update_time: string;
      automation: string;
      group: string;
      stage: string;
      resolver: string;
      assignee: string;
    }) => {
      const exceptionId = e.name.split("/").pop();
      const runId = e.run.split("/").pop();
      const automationId = e.automation;
      const groupSlug = e.group?.split("/").pop() ?? "";
      const config = getAutomationById(automationId);

      const kognitosUrl = `${APP_URL}/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${automationId}/runs/${runId}`;

      return {
        id: exceptionId,
        runId,
        automationId,
        automationName: config?.name ?? automationId,
        automationSlug: config?.slug,
        message: e.message,
        description: e.description,
        state: e.state,
        group: groupSlug,
        stage: e.stage,
        resolver: e.resolver,
        assignee: e.assignee,
        create_time: e.create_time,
        update_time: e.update_time,
        kognitosUrl,
      };
    }
  );

  return NextResponse.json({ exceptions });
}
