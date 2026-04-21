import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const { id, runId } = await params;
  const body = await request.json();
  const { message } = body as { message: string };

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const res = await req(
    `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${id}/runs/${runId}/agents/astral:sendMessage`,
    {
      method: "POST",
      body: JSON.stringify({
        user_message: {
          user_message: {
            user_message_type: "user_query",
            content_list: {
              items: [{ text: message }],
            },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      return NextResponse.json(
        {
          error:
            "Your API token doesn't have write permissions for the Resolution Agent. Use a token with exception-resolve scope, or resolve in the Kognitos platform.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: `Kognitos API error (${res.status}): ${text.slice(0, 200)}` },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
