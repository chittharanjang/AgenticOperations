"use client";

import { useEffect, useState } from "react";
import { Text, Icon, Skeleton } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { TicketTable } from "@/app/components/TicketTable";
import type { TicketWithSLA } from "@/app/api/tickets/route";

export default function IncidentsPage() {
  const [tickets, setTickets] = useState<TicketWithSLA[]>([]);
  const [metrics, setMetrics] = useState<{
    total: number;
    open: number;
    breached: number;
    awaiting: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        setTickets(data.tickets ?? []);
        setMetrics(data.metrics ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Incidents"
        subtitle="Active tickets sorted by urgency"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "IT Ticket Ops", href: "/ticket-ops" },
          { label: "Incidents" },
        ]}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Compact metrics bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Tag" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Open Tickets</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">{metrics?.open ?? 0}</Text>
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
                  <Icon type="Pause" size="xs" className="text-warning" />
                  <Text level="xSmall" color="muted" className="font-medium">Awaiting Action</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-warning">{metrics?.awaiting ?? 0}</Text>
              </div>
            </div>

            <TicketTable tickets={tickets} />
          </>
        )}
      </div>
    </div>
  );
}
