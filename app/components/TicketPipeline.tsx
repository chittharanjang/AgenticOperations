"use client";

import { Text, Icon } from "@kognitos/lattice";
import type { TicketWithSLA } from "@/app/api/tickets/route";

interface PipelineStage {
  key: string;
  label: string;
  icon: string;
  count: number;
  healthy: number;
  atRisk: number;
  breached: number;
}

interface TicketPipelineProps {
  tickets: TicketWithSLA[];
  onStageClick?: (stageKey: string | null) => void;
  activeStage?: string | null;
}

function classifyStage(ticket: TicketWithSLA): string {
  if (ticket.status === "resolved") return "resolved";
  if (ticket.status === "pending" && !ticket.serviceNowId && !ticket.jiraKey) return "incoming";
  if (ticket.type === "ticket_triage" && ticket.status !== "synced") return "triage";
  if (ticket.serviceNowId && !ticket.jiraKey) return "servicenow";
  if (ticket.jiraKey) return "jira";
  return "incoming";
}

export function TicketPipeline({ tickets, onStageClick, activeStage }: TicketPipelineProps) {
  const stages: PipelineStage[] = [
    { key: "incoming", label: "Incoming", icon: "Mail", count: 0, healthy: 0, atRisk: 0, breached: 0 },
    { key: "triage", label: "Triage", icon: "AlertTriangle", count: 0, healthy: 0, atRisk: 0, breached: 0 },
    { key: "servicenow", label: "ServiceNow", icon: "Server", count: 0, healthy: 0, atRisk: 0, breached: 0 },
    { key: "jira", label: "Jira", icon: "ListOrdered", count: 0, healthy: 0, atRisk: 0, breached: 0 },
    { key: "resolved", label: "Resolved", icon: "CircleCheck", count: 0, healthy: 0, atRisk: 0, breached: 0 },
  ];

  for (const ticket of tickets) {
    const stageKey = classifyStage(ticket);
    const stage = stages.find((s) => s.key === stageKey);
    if (!stage) continue;
    stage.count++;
    if (ticket.slaStatus === "breached") stage.breached++;
    else if (ticket.slaStatus === "at_risk") stage.atRisk++;
    else stage.healthy++;
  }

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon type="Activity" size="sm" className="text-muted-foreground" />
        <Text className="font-semibold">Ticket Pipeline</Text>
      </div>

      <div className="flex items-stretch gap-0">
        {stages.map((stage, i) => {
          const isActive = activeStage === stage.key;
          const hasBreached = stage.breached > 0;
          const hasAtRisk = stage.atRisk > 0;

          return (
            <div key={stage.key} className="flex items-stretch flex-1 min-w-0">
              <button
                onClick={() => onStageClick?.(isActive ? null : stage.key)}
                className={`flex-1 rounded-lg p-3 transition-all cursor-pointer border ${
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Icon
                    type={stage.icon as never}
                    size="sm"
                    className={
                      hasBreached
                        ? "text-destructive"
                        : hasAtRisk
                          ? "text-warning"
                          : "text-muted-foreground"
                    }
                  />
                  <Text level="xSmall" color="muted" className="font-medium truncate w-full text-center">
                    {stage.label}
                  </Text>
                  <Text className="text-xl font-bold">{stage.count}</Text>

                  {stage.count > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {stage.healthy > 0 && (
                        <span className="inline-block h-1.5 rounded-full bg-success" style={{ width: `${Math.max(8, (stage.healthy / stage.count) * 40)}px` }} />
                      )}
                      {stage.atRisk > 0 && (
                        <span className="inline-block h-1.5 rounded-full bg-warning" style={{ width: `${Math.max(8, (stage.atRisk / stage.count) * 40)}px` }} />
                      )}
                      {stage.breached > 0 && (
                        <span className="inline-block h-1.5 rounded-full bg-destructive" style={{ width: `${Math.max(8, (stage.breached / stage.count) * 40)}px` }} />
                      )}
                    </div>
                  )}
                </div>
              </button>

              {i < stages.length - 1 && (
                <div className="flex items-center px-1">
                  <Icon type="ChevronRight" size="xs" className="text-muted-foreground/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
