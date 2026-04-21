"use client";

import { useEffect, useState } from "react";
import { Text, Icon, Skeleton, Button } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { TicketPipeline } from "@/app/components/TicketPipeline";
import { CrossSystemTracker } from "@/app/components/CrossSystemTracker";
import { TicketTable } from "@/app/components/TicketTable";
import type { TicketWithSLA } from "@/app/api/tickets/route";

export default function PipelinePage() {
  const [tickets, setTickets] = useState<TicketWithSLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [invoking, setInvoking] = useState<string | null>(null);
  const [invokeResult, setInvokeResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function fetchData() {
    setLoading(true);
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  async function handleInvoke(automationId: string, label: string) {
    setInvoking(automationId);
    setInvokeResult(null);
    try {
      const res = await fetch(`/api/automations/${automationId}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: {}, stage: "AUTOMATION_STAGE_DRAFT" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInvokeResult({ type: "error", message: data.error ?? `Failed to start ${label}` });
        return;
      }
      setInvokeResult({ type: "success", message: `${label} started. Data will refresh shortly.` });
      setTimeout(() => fetchData(), 30_000);
    } catch {
      setInvokeResult({ type: "error", message: `Network error starting ${label}` });
    } finally {
      setInvoking(null);
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Ticket Pipeline"
        subtitle="Cross-system ticket flow between ServiceNow and Jira"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "IT Ticket Ops", href: "/ticket-ops" },
          { label: "Pipeline" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInvoke("T39jPe8Y7cOT31dBRZCIT", "SN-Jira Sync")}
              disabled={invoking !== null}
            >
              <Icon type="ChevronsRight" size="xs" />
              {invoking === "T39jPe8Y7cOT31dBRZCIT" ? "Starting..." : "Run SN-Jira Sync"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInvoke("rPL3NFLwK6qglS37kckrc", "Ticket Triage")}
              disabled={invoking !== null}
            >
              <Icon type="AlertTriangle" size="xs" />
              {invoking === "rPL3NFLwK6qglS37kckrc" ? "Starting..." : "Run Ticket Triage"}
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            {invokeResult && (
              <div className={`rounded-md px-3 py-2 text-sm ${invokeResult.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {invokeResult.message}
              </div>
            )}

            <TicketPipeline
              tickets={tickets}
              onStageClick={setPipelineStage}
              activeStage={pipelineStage}
            />

            <CrossSystemTracker tickets={tickets} />

            {pipelineStage && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon type="Filter" size="xs" className="text-muted-foreground" />
                  <Text level="small" color="muted">
                    Showing tickets in <span className="font-medium text-foreground capitalize">{pipelineStage}</span> stage
                  </Text>
                  <button
                    onClick={() => setPipelineStage(null)}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
                <TicketTable tickets={tickets} pipelineFilter={pipelineStage} />
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border">
              <Icon type="Info" size="xs" className="text-muted-foreground" />
              <Text level="xSmall" color="muted">
                Click a pipeline stage above to filter tickets by their current position in the flow.
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
