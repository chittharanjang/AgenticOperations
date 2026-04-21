"use client";

import { useState, useMemo } from "react";
import { Text, Badge, Icon } from "@kognitos/lattice";
import { SLABadge } from "@/app/components/SLABadge";
import { formatDuration } from "@/lib/sla";
import { TICKET_TYPE_LABELS, type TicketType } from "@/lib/sample-data";
import type { TicketWithSLA } from "@/app/api/tickets/route";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type SortKey = "priority" | "createdAt" | "slaStatus" | "processingTimeMs";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const SLA_ORDER: Record<string, number> = { breached: 0, at_risk: 1, on_track: 2 };

const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  synced: { label: "Synced", variant: "success" },
  triaged: { label: "Triaged", variant: "success" },
  resolved: { label: "Resolved", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
};

interface TicketTableProps {
  tickets: TicketWithSLA[];
  pipelineFilter?: string | null;
}

export function TicketTable({ tickets, pipelineFilter }: TicketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("slaStatus");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = [...tickets];

    if (pipelineFilter) {
      list = list.filter((t) => {
        if (pipelineFilter === "incoming") return t.status === "pending" && !t.serviceNowId && !t.jiraKey;
        if (pipelineFilter === "triage") return t.type === "ticket_triage" && t.status !== "synced" && t.status !== "resolved";
        if (pipelineFilter === "servicenow") return t.serviceNowId && !t.jiraKey;
        if (pipelineFilter === "jira") return !!t.jiraKey;
        if (pipelineFilter === "resolved") return t.status === "resolved";
        return true;
      });
    }
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    if (slaFilter !== "all") list = list.filter((t) => t.slaStatus === slaFilter);
    if (systemFilter === "both") list = list.filter((t) => t.serviceNowId && t.jiraKey);
    else if (systemFilter === "servicenow") list = list.filter((t) => t.serviceNowId && !t.jiraKey);
    else if (systemFilter === "jira") list = list.filter((t) => t.jiraKey && !t.serviceNowId);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "priority":
          cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
          break;
        case "slaStatus":
          cmp = (SLA_ORDER[a.slaStatus] ?? 9) - (SLA_ORDER[b.slaStatus] ?? 9);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "processingTimeMs":
          cmp = a.processingTimeMs - b.processingTimeMs;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return list;
  }, [tickets, pipelineFilter, priorityFilter, slaFilter, systemFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIndicator({ column }: { column: SortKey }) {
    if (sortKey !== column) return <Icon type="ChevronsUpDown" size="xs" className="text-muted-foreground/40 ml-1" />;
    return <Icon type={sortDir === "asc" ? "ChevronUp" : "ChevronDown"} size="xs" className="text-foreground ml-1" />;
  }

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-1.5">
          <Text level="xSmall" color="muted" className="font-medium">Priority:</Text>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <Text level="xSmall" color="muted" className="font-medium">SLA:</Text>
          <select
            value={slaFilter}
            onChange={(e) => setSlaFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All</option>
            <option value="breached">Breached</option>
            <option value="at_risk">At Risk</option>
            <option value="on_track">On Track</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <Text level="xSmall" color="muted" className="font-medium">System:</Text>
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="text-xs border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Systems</option>
            <option value="servicenow">ServiceNow Only</option>
            <option value="jira">Jira Only</option>
            <option value="both">Both SN + Jira</option>
          </select>
        </div>
        <Text level="xSmall" color="muted" className="ml-auto">
          {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <Icon type="ListFilter" size="xl" className="text-muted-foreground mx-auto mb-3" />
          <Text color="muted">No tickets match the current filters.</Text>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("priority")}
                >
                  <span className="inline-flex items-center">Priority<SortIndicator column="priority" /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ServiceNow</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Jira</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("slaStatus")}
                >
                  <span className="inline-flex items-center">SLA<SortIndicator column="slaStatus" /></span>
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => toggleSort("createdAt")}
                >
                  <span className="inline-flex items-center justify-end">Created<SortIndicator column="createdAt" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const typeMeta = TICKET_TYPE_LABELS[t.type as TicketType];
                const statusMeta = STATUS_LABELS[t.status] ?? STATUS_LABELS.pending;

                return (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITY_VARIANTS[t.priority] ?? "secondary"} className="text-xs capitalize">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Text level="small" className="truncate block">{t.title}</Text>
                      <Text level="xSmall" color="muted" className="font-mono text-xs">{t.id}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text level="xSmall" color="muted">{typeMeta?.label ?? t.type}</Text>
                    </td>
                    <td className="px-4 py-3">
                      {t.serviceNowId ? (
                        <Text level="xSmall" className="font-mono text-xs">{t.serviceNowId}</Text>
                      ) : (
                        <Text level="xSmall" color="muted">—</Text>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.jiraKey ? (
                        <Text level="xSmall" className="font-mono text-xs text-blue-600 dark:text-blue-400">{t.jiraKey}</Text>
                      ) : (
                        <Text level="xSmall" color="muted">—</Text>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMeta.variant} className="text-xs">{statusMeta.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <SLABadge status={t.slaStatus} detail={t.slaRemaining} />
                        <Text level="xSmall" color="muted" className="text-xs">
                          {t.processingTimeMs > 0 ? formatDuration(t.processingTimeMs) : t.slaRemaining}
                        </Text>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text level="xSmall" color="muted">{dayjs(t.createdAt).fromNow()}</Text>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
