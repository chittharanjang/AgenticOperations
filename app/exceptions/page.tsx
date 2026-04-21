"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Title, Text, Skeleton, Icon, Badge, Button } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { ResolutionAgent } from "@/app/components/ResolutionAgent";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const GROUP_LABELS: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
  missing_values: { label: "Missing Values", variant: "warning" },
  invalid_values: { label: "Invalid Values", variant: "destructive" },
  user_system_error: { label: "System Error", variant: "destructive" },
  internal_error: { label: "Internal Error", variant: "destructive" },
  validation_error: { label: "Validation Error", variant: "warning" },
};

interface ExceptionItem {
  id: string;
  runId: string;
  automationId: string;
  automationName: string;
  automationSlug?: string;
  message: string;
  description: string;
  state: string;
  group: string;
  stage: string;
  resolver: string;
  assignee: string;
  create_time: string;
  update_time: string;
  kognitosUrl: string;
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExceptions() {
      setLoading(true);
      try {
        const res = await fetch("/api/exceptions");
        if (!res.ok) return;
        const data = await res.json();
        setExceptions(data.exceptions ?? []);
      } catch {
        /* network error */
      } finally {
        setLoading(false);
      }
    }
    fetchExceptions();
  }, []);

  const pending = exceptions.filter((e) => e.state === "EXCEPTION_STATE_PENDING");
  const resolved = exceptions.filter((e) => e.state === "EXCEPTION_STATE_RESOLVED");

  const pendingByAutomation = useMemo(() => groupByAutomation(pending), [pending]);
  const resolvedByAutomation = useMemo(() => groupByAutomation(resolved), [resolved]);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Awaiting Guidance"
        subtitle={`${pending.length} exception${pending.length !== 1 ? "s" : ""} need${pending.length === 1 ? "s" : ""} attention across ${pendingByAutomation.length} automation${pendingByAutomation.length !== 1 ? "s" : ""}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Awaiting Guidance" },
        ]}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : pending.length === 0 && resolved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-lg border border-border bg-muted/20">
            <Icon type="CircleCheck" size="xl" className="text-success" />
            <Text level="large" className="font-medium">All clear</Text>
            <Text color="muted">No exceptions need attention right now.</Text>
          </div>
        ) : (
          <>
            {pendingByAutomation.length > 0 && (
              <div className="space-y-5">
                <Title level="h4">
                  Pending ({pending.length})
                </Title>
                {pendingByAutomation.map((group) => (
                  <AutomationGroup
                    key={group.automationName}
                    group={group}
                    isPending
                    expandedId={expandedId}
                    onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  />
                ))}
              </div>
            )}

            {resolvedByAutomation.length > 0 && (
              <div className="space-y-5">
                <Title level="h4">
                  Resolved ({resolved.length})
                </Title>
                {resolvedByAutomation.map((group) => (
                  <AutomationGroup
                    key={group.automationName}
                    group={group}
                    isPending={false}
                    expandedId={expandedId}
                    onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface AutomationGroupData {
  automationName: string;
  automationSlug?: string;
  exceptions: ExceptionItem[];
}

function groupByAutomation(items: ExceptionItem[]): AutomationGroupData[] {
  const map = new Map<string, AutomationGroupData>();
  for (const ex of items) {
    const key = ex.automationName || "Unknown Automation";
    if (!map.has(key)) {
      map.set(key, { automationName: key, automationSlug: ex.automationSlug, exceptions: [] });
    }
    map.get(key)!.exceptions.push(ex);
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => b.exceptions.length - a.exceptions.length);
  return groups;
}

const AUTOMATION_ICONS: Record<string, string> = {
  "ServiceNow to Jira Incident Sync": "ChevronsRight",
  "Ticket Escalation Bug Triage": "AlertTriangle",
  "ServiceNow On-Hold Incident Management": "ShieldAlert",
  "Resume Screener & Applicant Router": "FileScan",
};

function AutomationGroup({
  group,
  isPending,
  expandedId,
  onToggle,
}: {
  group: AutomationGroupData;
  isPending: boolean;
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const icon = AUTOMATION_ICONS[group.automationName] ?? "Settings";

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-3 ${isPending ? "bg-warning/5" : "bg-muted/20"}`}>
        <Icon type={icon as never} size="sm" className="text-muted-foreground" />
        <Text className="font-semibold flex-1">{group.automationName}</Text>
        <Badge variant={isPending ? "warning" : "secondary"} className="text-xs">
          {group.exceptions.length}
        </Badge>
      </div>
      <div className="divide-y divide-border">
        {group.exceptions.map((ex) => (
          <ExceptionCard
            key={ex.id}
            exception={ex}
            expanded={expandedId === ex.id}
            onToggle={() => onToggle(ex.id)}
            hideAutomationName
          />
        ))}
      </div>
    </div>
  );
}

function parseErrorSummary(raw: string): { summary: string; details: string | null } {
  if (!raw) return { summary: "An unknown error occurred.", details: null };

  const patterns = [
    /InvalidEmailAddressError:\s*(.+?)(?:\\n|$)/,
    /message:\s*"([^"]+)"/,
    /Error.*?:\s*(.+?)(?:\\n|$)/,
    /"message":\s*"([^"]+)"/,
  ];

  for (const pat of patterns) {
    const match = raw.match(pat);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/\\n/g, "")
        .replace(/\\"/g, '"')
        .trim();
      if (cleaned.length > 10) {
        return { summary: cleaned, details: raw };
      }
    }
  }

  const first200 = raw.slice(0, 200).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return { summary: first200, details: raw };
}

function ExceptionCard({
  exception: ex,
  expanded,
  onToggle,
  hideAutomationName,
}: {
  exception: ExceptionItem;
  expanded: boolean;
  onToggle: () => void;
  hideAutomationName?: boolean;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const isPending = ex.state === "EXCEPTION_STATE_PENDING";
  const groupConfig = GROUP_LABELS[ex.group] ?? { label: ex.group || "Unknown", variant: "secondary" as const };
  const { summary, details } = parseErrorSummary(ex.message);

  return (
    <div
      className={`transition-colors ${
        hideAutomationName
          ? isPending ? "bg-warning/5" : "bg-background"
          : `rounded-lg border ${isPending ? "border-warning/40 bg-warning/5" : "border-border bg-background"}`
      }`}
    >
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4"
        onClick={onToggle}
      >
        <div className={`mt-0.5 rounded-full p-1.5 ${isPending ? "bg-warning/20" : "bg-success/20"}`}>
          <Icon
            type={isPending ? "AlertTriangle" : "CircleCheck"}
            size="sm"
            className={isPending ? "text-warning" : "text-success"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Text level="small" className="font-medium">
              {ex.description || summary}
            </Text>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <Badge variant={groupConfig.variant}>{groupConfig.label}</Badge>
            {!hideAutomationName && (
              ex.automationSlug ? (
                <Link
                  href={`/automations/${ex.automationSlug}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ex.automationName}
                </Link>
              ) : (
                <Text level="xSmall" color="muted">{ex.automationName}</Text>
              )
            )}
            <Text level="xSmall" color="muted">
              {dayjs(ex.create_time).fromNow()}
            </Text>
            {ex.resolver && (
              <Text level="xSmall" color="muted">
                Resolved by {ex.resolver.split("/").pop()}
              </Text>
            )}
          </div>
        </div>

        <Icon
          type={expanded ? "ChevronUp" : "ChevronDown"}
          size="sm"
          className="text-muted-foreground mt-1 shrink-0"
        />
      </button>

      {expanded && (
      <>
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Human-readable summary */}
          <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Icon type="Info" size="sm" className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Text level="small" className="font-medium">What happened</Text>
                <Text level="small" color="muted">{summary}</Text>
              </div>
            </div>
            {ex.description && ex.description !== summary && (
              <div className="flex items-start gap-3">
                <Icon type="FileText" size="sm" className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <Text level="small" className="font-medium">Description</Text>
                  <Text level="small" color="muted">{ex.description}</Text>
                </div>
              </div>
            )}
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Text level="xSmall" color="muted" className="font-medium">Run ID</Text>
              <Text level="small" className="font-mono">{ex.runId}</Text>
            </div>
            <div>
              <Text level="xSmall" color="muted" className="font-medium">Exception ID</Text>
              <Text level="small" className="font-mono">{ex.id}</Text>
            </div>
            <div>
              <Text level="xSmall" color="muted" className="font-medium">Time</Text>
              <Text level="small">{dayjs(ex.create_time).format("MMM D, YYYY h:mm A")}</Text>
            </div>
          </div>

          {/* Raw details — collapsed by default */}
          {details && (
            <div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon type={showRaw ? "ChevronDown" : "ChevronRight"} size="xs" />
                {showRaw ? "Hide" : "Show"} full error log
              </button>
              {showRaw && (
                <pre className="mt-2 text-xs bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono">
                  {details}
                </pre>
              )}
            </div>
          )}
        </div>

        {isPending && (
          <ResolutionAgent
            automationId={ex.automationId}
            runId={ex.runId}
            kognitosUrl={ex.kognitosUrl}
          />
        )}
      </>
      )}
    </div>
  );
}
