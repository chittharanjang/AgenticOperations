"use client";

import { useState, useEffect } from "react";
import { Text, Icon, Skeleton, Badge, type IconType } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { AUTOMATIONS, AUTOMATION_GROUPS } from "@/lib/automations";

const SLUG_ICONS: Record<string, string> = {
  "resume-screener": "FileScan",
  "servicenow-jira": "ChevronsRight",
  "servicenow-incidents": "ShieldAlert",
  "ticket-triage": "AlertTriangle",
  "call-scheduling": "Phone",
  "interview-scheduling": "Calendar",
  "offer-generation": "Award",
  "email-reader": "Mail",
};

interface AutomationDetail {
  display_name: string;
  description: string;
  english_code: string;
  connections: Record<string, { connection_id: string }>;
}

function parseSOPSteps(englishCode: string): string[] {
  if (!englishCode) return [];
  return englishCode
    .split("\n")
    .filter((line) => /^\d+\.\s/.test(line.trim()))
    .map((line) => line.trim().replace(/^\d+\.\s*/, ""));
}

export default function SOPsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setExpandedId(hash);
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Standard Operating Procedures"
        subtitle="Step-by-step workflows for all AI agents"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "SOPs" },
        ]}
      />

      <div className="p-6 space-y-8">
        {AUTOMATION_GROUPS.map((group) => {
          const groupAutomations = AUTOMATIONS.filter((a) => a.group === group.key);
          if (groupAutomations.length === 0) return null;

          return (
            <div key={group.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon type={group.icon as IconType} size="sm" className="text-muted-foreground" />
                <Text className="font-semibold text-muted-foreground uppercase tracking-wider text-sm">{group.label}</Text>
              </div>

              <div className="space-y-2">
                {groupAutomations.map((a) => {
                  const isExpanded = expandedId === a.id;
                  const icon = SLUG_ICONS[a.slug] ?? "Settings";

                  return (
                    <div
                      key={a.id}
                      id={a.id}
                      className={`rounded-lg border transition-all scroll-mt-20 ${
                        isExpanded ? "border-primary/40 shadow-sm" : "border-border"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3"
                      >
                        <div className={`rounded-lg p-2 shrink-0 ${isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10"}`}>
                          <Icon type={icon as IconType} size="sm" className={isExpanded ? "" : "text-primary"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text className="font-semibold">{a.name}</Text>
                          {a.description && (
                            <Text level="xSmall" color="muted" className={isExpanded ? "" : "line-clamp-1"}>{a.description}</Text>
                          )}
                        </div>
                        <Icon type={isExpanded ? "ChevronUp" : "ChevronDown"} size="sm" className="text-muted-foreground shrink-0" />
                      </button>

                      {isExpanded && <SOPDetail automationId={a.id} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GuideEntry {
  title: string;
  root_cause: string;
  resolution_steps: string;
  resolution_code: string;
  state: string;
  create_time: string;
}

function SOPDetail({ automationId }: { automationId: string }) {
  const [detail, setDetail] = useState<AutomationDetail | null>(null);
  const [guides, setGuides] = useState<GuideEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/automations/${automationId}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/automations/${automationId}/guides`).then((r) => r.ok ? r.json() : { guides: [] }).catch(() => ({ guides: [] })),
    ]).then(([detailData, guidesData]) => {
      setDetail(detailData);
      setGuides(guidesData.guides ?? []);
    }).finally(() => setLoading(false));
  }, [automationId]);

  if (loading) {
    return (
      <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-24 rounded" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 pb-4 border-t border-border pt-3">
        <Text level="small" color="muted">Could not load SOP details.</Text>
      </div>
    );
  }

  const connections = Object.entries(detail.connections ?? {});
  const steps = parseSOPSteps(detail.english_code);

  return (
    <div className="border-t border-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* SOP Steps */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon type="ListOrdered" size="sm" className="text-primary" />
            <Text level="small" className="font-semibold uppercase tracking-wider text-muted-foreground">Procedure</Text>
          </div>

          {steps.length === 0 ? (
            <Text level="small" color="muted">No SOP steps available.</Text>
          ) : (
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold h-5 w-5 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <Text level="small" className="leading-relaxed">{step}</Text>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Integrations */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Icon type="Unplug" size="sm" className="text-primary" />
            <Text level="small" className="font-semibold uppercase tracking-wider text-muted-foreground">Integrations</Text>
          </div>

          {connections.length === 0 ? (
            <Text level="small" color="muted">No integrations configured.</Text>
          ) : (
            <div className="space-y-2">
              {connections.map(([alias, conn]) => (
                <div key={alias} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <div className="rounded-md bg-primary/10 p-1.5">
                    <Icon type="Power" size="xs" className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text level="small" className="font-medium capitalize">{alias.replace(/_/g, " ")}</Text>
                    <Text level="xSmall" color="muted" className="font-mono truncate block">{conn.connection_id}</Text>
                  </div>
                  <Badge variant="success" className="text-[10px] shrink-0">Connected</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting Guides */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon type="Wrench" size="sm" className="text-primary" />
          <Text level="small" className="font-semibold uppercase tracking-wider text-muted-foreground">
            Troubleshooting Guides
          </Text>
          {guides.length > 0 && (
            <Badge variant="success" className="text-[10px]">{guides.length}</Badge>
          )}
        </div>

        {guides.length === 0 ? (
          <Text level="small" color="muted">No approved troubleshooting guides yet. Guides are created when the Resolution Agent resolves an exception and the fix is approved.</Text>
        ) : (
          <div className="space-y-3">
            {guides.map((g, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon type="CircleCheck" size="xs" className="text-success" />
                  <Text level="small" className="font-semibold">{g.title}</Text>
                </div>

                <div className="space-y-2">
                  <div>
                    <Text level="xSmall" color="muted" className="font-medium uppercase tracking-wider">Root Cause</Text>
                    <Text level="small" className="mt-0.5">{g.root_cause}</Text>
                  </div>

                  <div>
                    <Text level="xSmall" color="muted" className="font-medium uppercase tracking-wider">Resolution</Text>
                    <Text level="small" className="mt-0.5 whitespace-pre-line">{g.resolution_steps}</Text>
                  </div>

                  {g.resolution_code && (
                    <div>
                      <Text level="xSmall" color="muted" className="font-medium uppercase tracking-wider">Code Fix</Text>
                      <pre className="mt-1 text-xs bg-muted/50 rounded-md px-3 py-2 font-mono overflow-x-auto">{g.resolution_code}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
