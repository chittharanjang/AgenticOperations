"use client";

import { useEffect, useState } from "react";
import { Text, Icon, Skeleton } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { SLADashboard } from "@/app/components/SLADashboard";
import { formatDuration, type TicketSLASummary } from "@/lib/sla";

export default function AnalyticsPage() {
  const [summaries, setSummaries] = useState<TicketSLASummary[]>([]);
  const [overall, setOverall] = useState<{
    totalTickets: number;
    completedTickets: number;
    totalBreached: number;
    totalAtRisk: number;
    overallCompliance: number;
  } | null>(null);
  const [avgProcessingMs, setAvgProcessingMs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [slaRes, ticketRes] = await Promise.all([
          fetch("/api/tickets/sla-summary"),
          fetch("/api/tickets"),
        ]);
        const slaData = await slaRes.json();
        const ticketData = await ticketRes.json();
        setSummaries(slaData.summaries ?? []);
        setOverall(slaData.overall ?? null);
        setAvgProcessingMs(ticketData.metrics?.avgProcessingMs ?? 0);
      } catch {
        /* handled by empty state */
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="IT Analytics"
        subtitle="SLA compliance and processing performance"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "IT Ticket Ops", href: "/ticket-ops" },
          { label: "Analytics" },
        ]}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Summary metrics */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Target" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Overall Compliance</Text>
                </div>
                <Text className={`text-lg font-bold mt-0.5 ${
                  (overall?.overallCompliance ?? 100) >= 90
                    ? "text-success"
                    : (overall?.overallCompliance ?? 100) >= 70
                      ? "text-warning"
                      : "text-destructive"
                }`}>
                  {overall?.overallCompliance ?? 100}%
                </Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Clock" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Avg Processing</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">
                  {avgProcessingMs > 0 ? formatDuration(avgProcessingMs) : "—"}
                </Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="AlertTriangle" size="xs" className="text-destructive" />
                  <Text level="xSmall" color="muted" className="font-medium">Total Breached</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-destructive">{overall?.totalBreached ?? 0}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="CircleCheck" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Tickets Completed</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">{overall?.completedTickets ?? 0}</Text>
              </div>
            </div>

            <SLADashboard summaries={summaries} />
          </>
        )}
      </div>
    </div>
  );
}
