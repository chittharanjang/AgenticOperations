"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Text,
  Button,
  Icon,
  Skeleton,
  Markdown,
  Badge,
} from "@kognitos/lattice";
import { KognitosIframe } from "@/app/components/KognitosIframe";

interface AgentEvent {
  type: "agent" | "user" | "tool";
  content: string;
  time?: string;
  isFinal?: boolean;
}

interface ResolutionAgentProps {
  automationId: string;
  runId: string;
  kognitosUrl: string;
}

export function ResolutionAgent({
  automationId,
  runId,
  kognitosUrl,
}: ResolutionAgentProps) {
  const [iframeOpen, setIframeOpen] = useState(false);
  const closeIframe = useCallback(() => setIframeOpen(false), []);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchEvents();
  }, [automationId, runId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/automations/${automationId}/runs/${runId}/events`
      );
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const msg = input.trim();
    if (!msg || sending) return;

    setSending(true);
    setSendError(null);
    setInput("");

    setEvents((prev) => [
      ...prev,
      { type: "user", content: msg, time: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(
        `/api/automations/${automationId}/runs/${runId}/events/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setSendError(data.error ?? `Error: ${res.status}`);
        return;
      }

      setTimeout(fetchEvents, 3000);
    } catch {
      setSendError("Network error — could not send message");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const agentMessages = events.filter((e) => e.type === "agent");
  const toolCalls = events.filter((e) => e.type === "tool");

  return (
    <div className="border-t border-border">
      <div className="px-5 py-3 bg-muted/30 flex items-center gap-2">
        <Icon type="Sparkles" size="sm" className="text-primary" />
        <Text level="small" className="font-medium">
          Resolution Agent
        </Text>
        {toolCalls.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {toolCalls.length} tool calls
          </Badge>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto px-5 py-3 space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : events.length === 0 ? (
          <Text level="small" color="muted">
            No resolution activity yet. Send a message to start.
          </Text>
        ) : (
          <>
            {toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
                {toolCalls.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {t.content}
                  </Badge>
                ))}
              </div>
            )}

            {agentMessages.map((evt, i) => (
              <div key={i} className="flex gap-2">
                <div className="shrink-0 mt-1 rounded-full bg-primary/20 p-1">
                  <Icon type="Sparkles" size="xs" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="chat-markdown">
                    <Markdown textProps={{ level: "small" }}>
                      {evt.content}
                    </Markdown>
                  </div>
                </div>
              </div>
            ))}

            {events
              .filter((e) => e.type === "user")
              .map((evt, i) => (
                <div key={`user-${i}`} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">
                    <Text level="small" className="text-primary-foreground">
                      {evt.content}
                    </Text>
                  </div>
                </div>
              ))}
          </>
        )}

        {sendError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <Text level="small" className="text-destructive">
              {sendError}
            </Text>
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => setIframeOpen(true)}>
                <Icon type="ExternalLink" size="sm" />
                Resolve in Kognitos instead
              </Button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type guidance for the Resolution Agent..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            <Icon type="SendHorizontal" size="sm" />
          </Button>
        </div>
      </div>

      {iframeOpen && (
        <KognitosIframe url={kognitosUrl} onClose={closeIframe} />
      )}
    </div>
  );
}
