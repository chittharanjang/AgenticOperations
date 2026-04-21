import type { PipelineStage } from "./sample-data";

export type SLAStatus = "on_track" | "at_risk" | "breached";

export interface SLADefinition {
  targetMs: number;
  warningMs: number;
  label: string;
}

export const PIPELINE_SLAS: Partial<Record<PipelineStage, SLADefinition>> = {
  screening: { targetMs: 2 * 3600_000, warningMs: 1.5 * 3600_000, label: "Complete screening in 2 hours" },
  screening_passed: { targetMs: 48 * 3600_000, warningMs: 36 * 3600_000, label: "Schedule interview within 48 hours" },
  interview: { targetMs: 72 * 3600_000, warningMs: 48 * 3600_000, label: "Complete interview within 72 hours" },
};

export const TICKET_SLAS = {
  servicenow_jira_sync: { targetMs: 30 * 60_000, warningMs: 20 * 60_000, label: "Sync within 30 minutes" },
  ticket_triage: { targetMs: 60 * 60_000, warningMs: 45 * 60_000, label: "Triage within 1 hour" },
  incident_management: { targetMs: 24 * 3600_000, warningMs: 18 * 3600_000, label: "Resolve within 24 hours" },
  exception_resolution: { targetMs: 4 * 3600_000, warningMs: 3 * 3600_000, label: "Resolve within 4 hours" },
} as const;

export function getSLAStatus(elapsedMs: number, definition: SLADefinition): SLAStatus {
  if (elapsedMs >= definition.targetMs) return "breached";
  if (elapsedMs >= definition.warningMs) return "at_risk";
  return "on_track";
}

export function getElapsedMs(enteredAt: string): number {
  return Date.now() - new Date(enteredAt).getTime();
}

export function getSLAStatusForStage(stage: PipelineStage, stageEnteredAt: string): SLAStatus {
  const def = PIPELINE_SLAS[stage];
  if (!def) return "on_track";
  return getSLAStatus(getElapsedMs(stageEnteredAt), def);
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function getSLARemainingLabel(elapsedMs: number, definition: SLADefinition): string {
  const remaining = definition.targetMs - elapsedMs;
  if (remaining <= 0) {
    return `${formatDuration(Math.abs(remaining))} overdue`;
  }
  return `${formatDuration(remaining)} remaining`;
}

export function computeSLACompliance<T>(
  items: T[],
  getProcessingMs: (item: T) => number,
  targetMs: number,
): number {
  const completed = items.filter((item) => getProcessingMs(item) > 0);
  if (completed.length === 0) return 100;
  const withinSLA = completed.filter((item) => getProcessingMs(item) <= targetMs);
  return Math.round((withinSLA.length / completed.length) * 100);
}

export type TicketSLAKey = keyof typeof TICKET_SLAS;

export function getTicketSLADefinition(type: TicketSLAKey): SLADefinition {
  return TICKET_SLAS[type];
}

export function getTicketSLAStatus(
  type: TicketSLAKey,
  createdAt: string,
  processingTimeMs: number,
  completedAt?: string,
): { status: SLAStatus; elapsed: number; remaining: string } {
  const def = TICKET_SLAS[type];
  const elapsed = completedAt
    ? processingTimeMs
    : processingTimeMs > 0
      ? processingTimeMs
      : getElapsedMs(createdAt);
  const status = getSLAStatus(elapsed, def);
  const remaining = getSLARemainingLabel(elapsed, def);
  return { status, elapsed, remaining };
}

export interface TicketSLASummary {
  type: TicketSLAKey;
  label: string;
  targetMs: number;
  totalTickets: number;
  completedTickets: number;
  withinSLA: number;
  breached: number;
  atRisk: number;
  compliancePercent: number;
  avgProcessingMs: number;
}

export function computeTicketSLASummaries<T>(
  tickets: T[],
  getType: (t: T) => TicketSLAKey,
  getProcessingMs: (t: T) => number,
  getCreatedAt: (t: T) => string,
  getCompletedAt: (t: T) => string | undefined,
): TicketSLASummary[] {
  const types: TicketSLAKey[] = ["servicenow_jira_sync", "ticket_triage", "incident_management", "exception_resolution"];

  return types
    .map((type) => {
      const def = TICKET_SLAS[type];
      const group = tickets.filter((t) => getType(t) === type);
      const completed = group.filter((t) => getProcessingMs(t) > 0);
      const withinSLA = completed.filter((t) => getProcessingMs(t) <= def.targetMs);
      const breached = group.filter((t) => {
        const elapsed = getCompletedAt(t) ? getProcessingMs(t) : getElapsedMs(getCreatedAt(t));
        return elapsed >= def.targetMs;
      });
      const atRisk = group.filter((t) => {
        const elapsed = getCompletedAt(t) ? getProcessingMs(t) : getElapsedMs(getCreatedAt(t));
        return elapsed >= def.warningMs && elapsed < def.targetMs;
      });
      const totalProcessingMs = completed.reduce((sum, t) => sum + getProcessingMs(t), 0);

      return {
        type,
        label: def.label,
        targetMs: def.targetMs,
        totalTickets: group.length,
        completedTickets: completed.length,
        withinSLA: withinSLA.length,
        breached: breached.length,
        atRisk: atRisk.length,
        compliancePercent: completed.length > 0
          ? Math.round((withinSLA.length / completed.length) * 100)
          : 100,
        avgProcessingMs: completed.length > 0
          ? Math.round(totalProcessingMs / completed.length)
          : 0,
      };
    })
    .filter((s) => s.totalTickets > 0);
}
