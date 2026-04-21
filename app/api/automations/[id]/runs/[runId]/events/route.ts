import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const { id, runId } = await params;

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${id}/runs/${runId}/agents/astral/events?page_size=100`
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Kognitos API error: ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const rawEvents = data.events ?? [];

  const events = rawEvents
    .map(
      (e: {
        name?: string;
        type?: string;
        create_time?: string;
        agent_message?: { content?: string };
        user_message?: { content?: string; user_message?: { content_list?: { items?: Array<{ text?: string }> } } };
        tool_call_request?: { tool_name?: string; arguments?: string };
        tool_call_response?: { result?: string };
        completion_response?: { content?: string; state?: string };
        progress_notification?: { content?: string };
      }) => {
        const type = e.type ?? "unknown";

        if (type === "agent_message" && e.agent_message?.content) {
          return {
            type: "agent",
            content: e.agent_message.content,
            time: e.create_time,
          };
        }

        if (type === "user_message") {
          const text =
            e.user_message?.content ??
            e.user_message?.user_message?.content_list?.items?.[0]?.text ??
            "";
          if (text) {
            return { type: "user", content: text, time: e.create_time };
          }
        }

        if (type === "completion_response" && e.completion_response?.content) {
          return {
            type: "agent",
            content: e.completion_response.content,
            time: e.create_time,
            isFinal: true,
          };
        }

        if (type === "tool_call_request" && e.tool_call_request?.tool_name) {
          const toolName = e.tool_call_request.tool_name
            .replace("mcp__astral-tools__", "")
            .replace(/_/g, " ");
          return {
            type: "tool",
            content: toolName,
            time: e.create_time,
          };
        }

        return null;
      }
    )
    .filter(Boolean);

  return NextResponse.json({ events });
}
