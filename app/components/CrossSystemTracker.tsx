"use client";

import { Text, Badge, Icon } from "@kognitos/lattice";
import { SLABadge } from "@/app/components/SLABadge";
import { formatDuration } from "@/lib/sla";
import type { TicketWithSLA } from "@/app/api/tickets/route";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface CrossSystemTrackerProps {
  tickets: TicketWithSLA[];
}

const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

export function CrossSystemTracker({ tickets }: CrossSystemTrackerProps) {
  const crossSystem = tickets.filter((t) => t.serviceNowId && t.jiraKey);
  const snOnly = tickets.filter((t) => t.serviceNowId && !t.jiraKey);

  if (crossSystem.length === 0 && snOnly.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-8 text-center">
        <Icon type="Link" size="xl" className="text-muted-foreground mx-auto mb-3" />
        <Text color="muted">No cross-system tickets found.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon type="Link" size="xs" className="text-success" />
            <Text level="xSmall" color="muted" className="font-medium">Linked (SN + Jira)</Text>
          </div>
          <Text className="text-2xl font-bold">{crossSystem.length}</Text>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon type="Server" size="xs" className="text-warning" />
            <Text level="xSmall" color="muted" className="font-medium">ServiceNow Only</Text>
          </div>
          <Text className="text-2xl font-bold">{snOnly.length}</Text>
          <Text level="xSmall" color="muted">Awaiting Jira sync</Text>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon type="AlertTriangle" size="xs" className="text-destructive" />
            <Text level="xSmall" color="muted" className="font-medium">SLA Issues</Text>
          </div>
          <Text className="text-2xl font-bold text-destructive">
            {[...crossSystem, ...snOnly].filter((t) => t.slaStatus === "breached").length}
          </Text>
        </div>
      </div>

      {/* Linked tickets table */}
      {crossSystem.length > 0 && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
            <Icon type="Link" size="sm" className="text-muted-foreground" />
            <Text className="font-semibold">Cross-System Tickets</Text>
            <Badge variant="secondary" className="text-xs ml-1">{crossSystem.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ServiceNow</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Jira</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Processing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {crossSystem.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITY_VARIANTS[t.priority]} className="text-xs capitalize">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Text level="small" className="truncate block">{t.title}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text level="xSmall" className="font-mono text-xs">{t.serviceNowId}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text level="xSmall" className="font-mono text-xs text-blue-600 dark:text-blue-400">{t.jiraKey}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={t.status === "synced" || t.status === "resolved" ? "success" : t.status === "failed" ? "destructive" : "warning"}
                        className="text-xs capitalize"
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <SLABadge status={t.slaStatus} detail={t.slaRemaining} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text level="xSmall" color="muted">
                        {t.processingTimeMs > 0 ? formatDuration(t.processingTimeMs) : "In progress"}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SN-only tickets awaiting sync */}
      {snOnly.length > 0 && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
            <Icon type="Clock" size="sm" className="text-warning" />
            <Text className="font-semibold">Awaiting Jira Sync</Text>
            <Badge variant="warning" className="text-xs ml-1">{snOnly.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ServiceNow</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Waiting Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snOnly.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant={PRIORITY_VARIANTS[t.priority]} className="text-xs capitalize">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Text level="small" className="truncate block">{t.title}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <Text level="xSmall" className="font-mono text-xs">{t.serviceNowId}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <SLABadge status={t.slaStatus} detail={t.slaRemaining} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Text level="xSmall" color="muted">{dayjs(t.createdAt).fromNow()}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
