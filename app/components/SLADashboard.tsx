"use client";

import { Text, Icon } from "@kognitos/lattice";
import { formatDuration, type TicketSLASummary } from "@/lib/sla";
import { TICKET_TYPE_LABELS, type TicketType } from "@/lib/sample-data";

interface SLADashboardProps {
  summaries: TicketSLASummary[];
}

const TYPE_ICONS: Record<string, string> = {
  servicenow_jira_sync: "ChevronsRight",
  ticket_triage: "AlertTriangle",
  incident_management: "ShieldAlert",
  exception_resolution: "AlertCircle",
};

function complianceColor(pct: number): string {
  if (pct >= 90) return "text-success";
  if (pct >= 70) return "text-warning";
  return "text-destructive";
}

function barColor(pct: number): string {
  if (pct >= 90) return "bg-success";
  if (pct >= 70) return "bg-warning";
  return "bg-destructive";
}

export function SLADashboard({ summaries }: SLADashboardProps) {
  if (summaries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon type="Clock" size="sm" className="text-muted-foreground" />
        <Text className="font-semibold">SLA Compliance by Category</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaries.map((s) => {
          const meta = TICKET_TYPE_LABELS[s.type as TicketType];
          const icon = TYPE_ICONS[s.type] ?? "Clock";
          const label = meta?.label ?? s.label;

          return (
            <div key={s.type} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon type={icon as never} size="xs" className="text-muted-foreground" />
                <Text level="small" className="font-medium">{label}</Text>
              </div>

              <div className="flex items-baseline gap-1.5">
                <Text className={`text-2xl font-bold ${complianceColor(s.compliancePercent)}`}>
                  {s.compliancePercent}%
                </Text>
                <Text level="xSmall" color="muted">compliance</Text>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(s.compliancePercent)}`}
                  style={{ width: `${s.compliancePercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Target: {formatDuration(s.targetMs)}
                </span>
                <span className="text-muted-foreground">
                  Avg: {s.avgProcessingMs > 0 ? formatDuration(s.avgProcessingMs) : "—"}
                </span>
              </div>

              <div className="flex gap-3 text-xs">
                <span className="text-success">{s.withinSLA} on track</span>
                <span className="text-warning">{s.atRisk} at risk</span>
                <span className="text-destructive">{s.breached} breached</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
