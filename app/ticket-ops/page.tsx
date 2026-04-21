"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Text, Icon, Skeleton, Button } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { TicketPipeline } from "@/app/components/TicketPipeline";
import { formatDuration } from "@/lib/sla";
import type { TicketWithSLA } from "@/app/api/tickets/route";

export default function TicketOpsPage() {
  const [tickets, setTickets] = useState<TicketWithSLA[]>([]);
  const [metrics, setMetrics] = useState<{
    total: number;
    open: number;
    breached: number;
    awaiting: number;
    slaCompliance: number;
    avgProcessingMs: number;
    liveCount?: number;
    sampleCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoking, setInvoking] = useState<string | null>(null);
  const [invokeResult, setInvokeResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setMetrics(data.metrics ?? null);
    } catch {
      /* empty state */
    } finally {
      setLoading(false);
    }
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

  const NAV_CARDS = [
    {
      href: "/ticket-ops/pipeline",
      icon: "Link" as const,
      title: "Pipeline",
      description: "Cross-system ticket flow between ServiceNow and Jira",
      stat: tickets.filter((t) => t.serviceNowId && t.jiraKey).length,
      statLabel: "linked tickets",
    },
    {
      href: "/ticket-ops/incidents",
      icon: "List" as const,
      title: "Incidents",
      description: "Active tickets sorted by urgency and SLA status",
      stat: metrics?.open ?? 0,
      statLabel: "open tickets",
      highlight: (metrics?.breached ?? 0) > 0,
    },
    {
      href: "/ticket-ops/analytics",
      icon: "BarChart3" as const,
      title: "Analytics",
      description: "SLA compliance and processing performance by category",
      stat: metrics?.slaCompliance ?? 100,
      statLabel: "% SLA compliance",
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="IT Ticket Operations"
        subtitle="Cross-system ticket monitoring, SLA tracking, and pipeline visibility"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "IT Ticket Ops" },
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
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
            <Skeleton className="h-32 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Hero Metrics */}
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Tag" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Total Tickets</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">{metrics?.total ?? 0}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Clock" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">SLA Compliance</Text>
                </div>
                <Text className={`text-lg font-bold mt-0.5 ${
                  (metrics?.slaCompliance ?? 100) >= 90
                    ? "text-success"
                    : (metrics?.slaCompliance ?? 100) >= 70
                      ? "text-warning"
                      : "text-destructive"
                }`}>
                  {metrics?.slaCompliance ?? 100}%
                </Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="AlertTriangle" size="xs" className="text-destructive" />
                  <Text level="xSmall" color="muted" className="font-medium">Breached SLA</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-destructive">{metrics?.breached ?? 0}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Clock4" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Avg Processing</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">
                  {metrics?.avgProcessingMs ? formatDuration(metrics.avgProcessingMs) : "—"}
                </Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Pause" size="xs" className="text-warning" />
                  <Text level="xSmall" color="muted" className="font-medium">Awaiting Action</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-warning">{metrics?.awaiting ?? 0}</Text>
              </div>
            </div>

            {invokeResult && (
              <div className={`rounded-md px-3 py-2 text-sm ${invokeResult.type === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {invokeResult.message}
              </div>
            )}

            {/* Pipeline visualization */}
            <TicketPipeline tickets={tickets} />

            {/* Navigation cards to sub-pages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {NAV_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`rounded-xl border bg-background p-5 space-y-3 transition-all hover:shadow-md hover:border-primary/40 ${
                    card.highlight ? "border-destructive/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon type={card.icon as never} size="sm" className="text-primary" />
                    </div>
                    <Text className="font-semibold">{card.title}</Text>
                  </div>
                  <Text level="small" color="muted">{card.description}</Text>
                  <div className="flex items-baseline gap-1.5">
                    <Text className="text-xl font-bold">{card.stat}</Text>
                    <Text level="xSmall" color="muted">{card.statLabel}</Text>
                  </div>
                </Link>
              ))}
            </div>

            {/* Data source indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border">
              <Icon type="Info" size="xs" className="text-muted-foreground" />
              <Text level="xSmall" color="muted">
                {(metrics?.liveCount ?? 0) > 0
                  ? `${metrics?.liveCount} live ticket${metrics?.liveCount === 1 ? "" : "s"} from Kognitos runs`
                  : "No live ticket data available"}
                {(metrics?.sampleCount ?? 0) > 0 &&
                  ` + ${metrics?.sampleCount} sample ticket${metrics?.sampleCount === 1 ? "" : "s"} (demo fallback)`}
                .
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
