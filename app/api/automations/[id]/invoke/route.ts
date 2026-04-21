import { NextResponse } from "next/server";
import { invokeAutomation, pollRun } from "@/lib/kognitos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { inputs = {}, poll = false, stage = "AUTOMATION_STAGE_DRAFT" } = body as {
    inputs?: Record<string, unknown>;
    poll?: boolean;
    stage?: string;
  };

  const { runId, error } = await invokeAutomation(id, inputs, stage);

  if (!runId) {
    return NextResponse.json(
      { error: error ?? "Failed to invoke automation" },
      { status: 500 }
    );
  }

  if (poll) {
    const result = await pollRun(id, runId);
    return NextResponse.json({ runId, ...result });
  }

  return NextResponse.json({ runId });
}
