import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID, parseOutputValue, extractExceptionMessage } from "@/lib/kognitos";
import type { RunState } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveRunState(state: Record<string, unknown>): RunState {
  if (state.completed) return "completed";
  if (state.failed) return "failed";
  if (state.awaiting_guidance) return "awaiting_guidance";
  if (state.executing) return "executing";
  if (state.pending) return "pending";
  if (state.stopped) return "stopped";
  return "pending";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${id}/runs?pageSize=50`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const runs = (data.runs ?? []).map(
    (r: {
      name: string;
      create_time: string;
      update_time?: string;
      state: Record<string, unknown>;
      user_inputs?: Record<string, { text?: string }>;
    }) => {
      const status = resolveRunState(r.state);
      const completedState = r.state.completed as
        | { outputs?: Record<string, Record<string, unknown>>; update_time?: string }
        | undefined;

      const outputs: Record<string, unknown> = {};
      if (completedState?.outputs) {
        for (const [key, val] of Object.entries(completedState.outputs)) {
          outputs[key] = parseOutputValue(val);
        }
      }

      const failedState = r.state.failed as
        | { error?: { description?: string }; description?: string }
        | undefined;
      const guidanceState = r.state.awaiting_guidance as
        | { exception?: string; description?: string }
        | undefined;

      // The `exception` field is a resource path, not a message — use `description` instead
      let error =
        failedState?.error?.description ??
        failedState?.description ??
        undefined;
      if (!error && guidanceState?.description) {
        error = extractExceptionMessage(guidanceState.description);
      } else if (!error && guidanceState) {
        error = "Awaiting guidance";
      }

      return {
        id: r.name.split("/").pop(),
        create_time: r.create_time,
        update_time: r.update_time ?? completedState?.update_time,
        status,
        outputs,
        error,
        user_inputs: r.user_inputs,
      };
    }
  );

  return NextResponse.json({ runs });
}
