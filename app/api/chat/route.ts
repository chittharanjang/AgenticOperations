import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { query, execute, TABLES } from "@/lib/databricks";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { req, ORG_ID, WORKSPACE_ID } from "@/lib/kognitos";
import { getAutomationBySlug } from "@/lib/automations";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RESUME_SCREENER = getAutomationBySlug("resume-screener");
const SCREENER_ID = RESUME_SCREENER?.id ?? "";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_screenings",
    description:
      "List recent candidate screenings with their relevance scores, routing decisions, and dates. Use this to answer questions about how many candidates were screened, acceptance rates, or pipeline status.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_screening",
    description:
      "Get full details of a specific candidate screening by its ID, including the candidate's name, relevance score, routing decision, and any errors. Use when the user asks about a specific candidate or screening.",
    input_schema: {
      type: "object" as const,
      properties: {
        screening_id: { type: "string", description: "The screening ID to look up" },
      },
      required: ["screening_id"],
    },
  },
  {
    name: "get_screening_config",
    description:
      "Get details about how the resume screening process works — the evaluation criteria, connections to job systems, and configuration. Use when users ask how screening works or what criteria are used.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_screenings": {
      const res = await req(
        `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${SCREENER_ID}/runs?pageSize=50`
      );
      if (!res.ok) return `Error fetching screenings: ${res.status}`;
      const data = await res.json();
      return JSON.stringify(data.runs ?? [], null, 2);
    }
    case "get_screening": {
      const screeningId = input.screening_id as string;
      const res = await req(
        `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${SCREENER_ID}/runs/${screeningId}`
      );
      if (!res.ok) return `Error fetching screening: ${res.status}`;
      const data = await res.json();
      return JSON.stringify(data, null, 2);
    }
    case "get_screening_config": {
      const res = await req(
        `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${SCREENER_ID}`
      );
      if (!res.ok) return `Error fetching config: ${res.status}`;
      const data = await res.json();
      return JSON.stringify(
        {
          name: data.display_name,
          description: data.description,
          screening_criteria: data.english_code?.slice(0, 3000),
          connections: data.connections,
        },
        null,
        2
      );
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

async function generateTitle(userMessage: string, assistantMessage: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 30,
    messages: [
      {
        role: "user",
        content: `Summarize this conversation in 4-6 words for a sidebar title. No quotes, no punctuation at the end.\n\nUser: ${userMessage}\nAssistant: ${assistantMessage.slice(0, 300)}`,
      },
    ],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text.trim() : "New Conversation";
}

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, message } = body as { sessionId: string; message: string };

  if (!message || !sessionId) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
  }

  await execute(
    `INSERT INTO ${TABLES.messages} (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, current_timestamp())`,
    [crypto.randomUUID(), sessionId, "user", message],
  );

  const systemPrompt = await buildSystemPrompt();

  let existingMessages: Anthropic.MessageParam[] = [];
  const dbMessages = await query<{ role: string; content: string }>(
    `SELECT role, content FROM ${TABLES.messages} WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId],
  );
  if (dbMessages.length > 0) {
    const filtered = dbMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    for (const msg of filtered) {
      const last = existingMessages[existingMessages.length - 1];
      if (last && last.role === msg.role) {
        last.content = last.content + "\n\n" + msg.content;
      } else {
        existingMessages.push(msg);
      }
    }
  }
  if (existingMessages.length === 0) {
    existingMessages = [{ role: "user", content: message }];
  }

  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;
      const send = (data: Record<string, unknown>) => {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          streamClosed = true;
        }
      };

      try {
        let messages = [...existingMessages];
        let fullAssistantResponse = "";

        for (let iteration = 0; iteration < 5; iteration++) {
          if (iteration > 0 && fullAssistantResponse.length > 0) {
            fullAssistantResponse += "\n\n";
            send({ type: "text", content: "\n\n" });
          }

          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            tools: TOOLS,
            messages,
          });

          stream.on("text", (text) => {
            fullAssistantResponse += text;
            send({ type: "text", content: text });
          });

          const finalMessage = await stream.finalMessage();

          const toolBlocks = finalMessage.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );

          if (toolBlocks.length === 0) break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of toolBlocks) {
            send({ type: "tool_use", tool_name: block.name, tool_input: block.input });
            let result: string;
            try {
              result = await executeTool(block.name, block.input as Record<string, unknown>);
            } catch (e) {
              result = `Tool error: ${e instanceof Error ? e.message : "Unknown error"}`;
            }
            send({ type: "tool_result", tool_name: block.name, content: result.slice(0, 200) + "..." });
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
          }

          messages = [
            ...messages,
            { role: "assistant", content: finalMessage.content },
            { role: "user", content: toolResults },
          ];
        }

        await execute(
          `INSERT INTO ${TABLES.messages} (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, current_timestamp())`,
          [crypto.randomUUID(), sessionId, "assistant", fullAssistantResponse || ""],
        );

        const countRows = await query<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt FROM ${TABLES.messages} WHERE session_id = ?`,
          [sessionId],
        );
        const count = parseInt(countRows[0]?.cnt ?? "0", 10);

        if (count <= 3) {
          try {
            const title = await generateTitle(message, fullAssistantResponse);
            await execute(
              `UPDATE ${TABLES.sessions} SET title = ?, updated_at = current_timestamp() WHERE id = ?`,
              [title, sessionId],
            );
            send({ type: "title", content: title });
          } catch {
            /* title generation is best-effort */
          }
        }

        send({ type: "done" });
      } catch (err) {
        console.error("[chat] Stream error:", err);
        try {
          send({ type: "error", content: err instanceof Error ? err.message : "Unknown error" });
        } catch { /* controller may be closed */ }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
