import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID, parseOutputValue } from "@/lib/kognitos";
import { SAMPLE_TICKETS, type TicketOpsRecord, type TicketType } from "@/lib/sample-data";
import { getTicketSLAStatus, type TicketSLAKey } from "@/lib/sla";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export interface TicketWithSLA extends TicketOpsRecord {
  slaStatus: "on_track" | "at_risk" | "breached";
  slaRemaining: string;
  slaElapsedMs: number;
  dataSource: "live" | "sample";
}

const AUTOMATION_IDS = {
  servicenow_jira_sync: "T39jPe8Y7cOT31dBRZCIT",
  ticket_triage: "rPL3NFLwK6qglS37kckrc",
  incident_management: "YtsTMqBL7UrrsJne96Fu4",
} as const;

const THIRTY_MIN = 30 * 60_000;
const ONE_HOUR = 60 * 60_000;

const TRIAGE_PRIORITY_MAP: Record<string, TicketOpsRecord["priority"]> = {
  api_errors: "critical",
  data_not_saving: "critical",
  permission_bug: "high",
  notification_bug: "high",
  broken_ui: "medium",
  performance_bug: "medium",
};

function parseDictionary(v: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!v || typeof v !== "object") return result;
  const dict = v as { dictionary?: { entries?: Array<{ key: { text?: string }; value: Record<string, unknown> }> } };
  const entries = dict.dictionary?.entries;
  if (!Array.isArray(entries)) return result;
  for (const entry of entries) {
    const key = entry.key?.text;
    if (!key) continue;
    result[key] = parseOutputValue(entry.value);
  }
  return result;
}

function enrichWithSLA(ticket: TicketOpsRecord, source: "live" | "sample"): TicketWithSLA {
  const { status, elapsed, remaining } = getTicketSLAStatus(
    ticket.type as TicketSLAKey,
    ticket.createdAt,
    ticket.processingTimeMs,
    ticket.completedAt,
  );
  return { ...ticket, slaStatus: status, slaRemaining: remaining, slaElapsedMs: elapsed, dataSource: source };
}

interface RawRun {
  name: string;
  create_time: string;
  update_time?: string;
  state: Record<string, unknown>;
}

async function fetchRuns(automationId: string): Promise<RawRun[]> {
  try {
    const res = await req(
      `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${automationId}/runs?pageSize=50`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.runs ?? [];
  } catch {
    return [];
  }
}

function extractTriageTickets(runs: RawRun[]): TicketOpsRecord[] {
  const tickets: TicketOpsRecord[] = [];
  let counter = 0;

  for (const run of runs) {
    const completed = run.state.completed as { outputs?: Record<string, Record<string, unknown>>; update_time?: string } | undefined;
    if (!completed?.outputs) continue;

    const reportRaw = completed.outputs.processing_report;
    if (!reportRaw) continue;

    const parsed = parseOutputValue(reportRaw);
    if (!Array.isArray(parsed)) continue;

    for (const itemRaw of parsed) {
      const item = typeof itemRaw === "object" && itemRaw !== null && "dictionary" in (itemRaw as object)
        ? parseDictionary(itemRaw)
        : itemRaw as Record<string, unknown>;

      const ticketNumber = String(item.ticket_number ?? "");
      const subject = String(item.subject ?? "");
      const category = String(item.category ?? "");
      const priority = (item.priority as string) ?? TRIAGE_PRIORITY_MAP[category] ?? "medium";

      if (!ticketNumber) continue;

      counter++;
      tickets.push({
        id: `LT-${counter.toString().padStart(3, "0")}`,
        type: "ticket_triage" as TicketType,
        title: subject || `Bug report — ${category.replace(/_/g, " ")}`,
        source: "Email",
        status: "triaged",
        priority: priority as TicketOpsRecord["priority"],
        createdAt: run.create_time,
        completedAt: completed.update_time ?? run.update_time,
        processingTimeMs: completed.update_time
          ? new Date(completed.update_time).getTime() - new Date(run.create_time).getTime()
          : 0,
        slaTargetMs: ONE_HOUR,
        serviceNowId: ticketNumber,
      });
    }
  }

  return tickets;
}

function extractSyncTickets(runs: RawRun[]): TicketOpsRecord[] {
  const tickets: TicketOpsRecord[] = [];
  let counter = 0;

  for (const run of runs) {
    const completed = run.state.completed as { outputs?: Record<string, Record<string, unknown>>; update_time?: string } | undefined;
    if (!completed?.outputs) continue;

    const reportRaw = completed.outputs.sync_report;
    if (!reportRaw) continue;

    const parsed = parseOutputValue(reportRaw);
    if (!Array.isArray(parsed)) continue;

    for (const itemRaw of parsed) {
      const item = typeof itemRaw === "object" && itemRaw !== null && "dictionary" in (itemRaw as object)
        ? parseDictionary(itemRaw)
        : itemRaw as Record<string, unknown>;

      const snNumber = String(item.servicenow_number ?? "");
      const shortDesc = String(item.short_description ?? "");
      const action = String(item.action ?? "");
      const jiraKey = String(item.jira_key ?? "");
      const rawPriority = String(item.priority ?? "3");

      if (!snNumber) continue;

      const priorityMap: Record<string, TicketOpsRecord["priority"]> = {
        "1": "critical", "2": "high", "3": "medium", "4": "low",
        critical: "critical", high: "high", medium: "medium", low: "low",
      };

      counter++;
      tickets.push({
        id: `LS-${counter.toString().padStart(3, "0")}`,
        type: "servicenow_jira_sync" as TicketType,
        title: shortDesc || `ServiceNow incident ${snNumber}`,
        source: "ServiceNow",
        status: action === "auto_resolved" ? "resolved" : "synced",
        priority: priorityMap[rawPriority] ?? "medium",
        createdAt: run.create_time,
        completedAt: completed.update_time ?? run.update_time,
        processingTimeMs: completed.update_time
          ? new Date(completed.update_time).getTime() - new Date(run.create_time).getTime()
          : 0,
        slaTargetMs: THIRTY_MIN,
        serviceNowId: snNumber,
        jiraKey: jiraKey || undefined,
      });
    }
  }

  return tickets;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type");
  const priorityFilter = searchParams.get("priority");
  const slaFilter = searchParams.get("sla");
  const statusFilter = searchParams.get("status");
  const systemFilter = searchParams.get("system");

  const [triageRuns, syncRuns] = await Promise.all([
    fetchRuns(AUTOMATION_IDS.ticket_triage),
    fetchRuns(AUTOMATION_IDS.servicenow_jira_sync),
  ]);

  const liveTriageTickets = extractTriageTickets(triageRuns);
  const liveSyncTickets = extractSyncTickets(syncRuns);

  const liveSnIds = new Set([
    ...liveTriageTickets.map((t) => t.serviceNowId).filter(Boolean),
    ...liveSyncTickets.map((t) => t.serviceNowId).filter(Boolean),
  ]);

  const sampleFallback = SAMPLE_TICKETS.filter(
    (t) => !t.serviceNowId || !liveSnIds.has(t.serviceNowId),
  );

  let tickets: TicketWithSLA[] = [
    ...liveTriageTickets.map((t) => enrichWithSLA(t, "live")),
    ...liveSyncTickets.map((t) => enrichWithSLA(t, "live")),
    ...sampleFallback.map((t) => enrichWithSLA(t, "sample")),
  ];

  if (typeFilter) {
    tickets = tickets.filter((t) => t.type === typeFilter);
  }
  if (priorityFilter) {
    tickets = tickets.filter((t) => t.priority === priorityFilter);
  }
  if (statusFilter) {
    tickets = tickets.filter((t) => t.status === statusFilter);
  }
  if (slaFilter) {
    tickets = tickets.filter((t) => t.slaStatus === slaFilter);
  }
  if (systemFilter === "both") {
    tickets = tickets.filter((t) => t.serviceNowId && t.jiraKey);
  } else if (systemFilter === "servicenow") {
    tickets = tickets.filter((t) => t.serviceNowId);
  } else if (systemFilter === "jira") {
    tickets = tickets.filter((t) => t.jiraKey);
  }

  tickets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const liveCount = tickets.filter((t) => t.dataSource === "live").length;
  const sampleCount = tickets.filter((t) => t.dataSource === "sample").length;
  const openCount = tickets.filter((t) => t.status === "pending").length;
  const breachedCount = tickets.filter((t) => t.slaStatus === "breached").length;
  const awaitingCount = tickets.filter(
    (t) => t.status === "failed" || t.status === "pending",
  ).length;
  const completedTickets = tickets.filter((t) => t.processingTimeMs > 0);
  const avgProcessingMs =
    completedTickets.length > 0
      ? Math.round(
          completedTickets.reduce((s, t) => s + t.processingTimeMs, 0) /
            completedTickets.length,
        )
      : 0;
  const withinSLA = completedTickets.filter(
    (t) => t.processingTimeMs <= t.slaTargetMs,
  ).length;
  const slaCompliance =
    completedTickets.length > 0
      ? Math.round((withinSLA / completedTickets.length) * 100)
      : 100;

  return NextResponse.json({
    tickets,
    metrics: {
      total: tickets.length,
      open: openCount,
      breached: breachedCount,
      awaiting: awaitingCount,
      slaCompliance,
      avgProcessingMs,
      liveCount,
      sampleCount,
    },
  });
}
