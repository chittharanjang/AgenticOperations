"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Text, Icon, Button, Skeleton, Spinner } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import {
  SAMPLE_CANDIDATES,
  STAGE_ORDER,
  STAGE_LABELS,
  type Candidate,
  type PipelineStage,
} from "@/lib/sample-data";
import { getSLAStatusForStage, getElapsedMs, formatDuration } from "@/lib/sla";

export default function RecruitingOverview() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch_() {
      try {
        const res = await fetch("/api/pipeline/candidates");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const fetched: Candidate[] = data.candidates ?? [];
        setCandidates(fetched.length > 0 ? fetched : SAMPLE_CANDIDATES);
      } catch {
        if (!cancelled) setCandidates(SAMPLE_CANDIDATES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch_();
    return () => { cancelled = true; };
  }, []);

  const active = candidates.filter((c) => c.stage !== "rejected");
  const rejected = candidates.filter((c) => c.stage === "rejected").length;
  const total = candidates.length;
  const acceptanceRate = total > 0 ? Math.round((active.length / total) * 100) : 0;

  const slaBreached = active.filter((c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "breached").length;
  const slaAtRisk = active.filter((c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "at_risk").length;
  const slaOnTrack = active.filter((c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "on_track").length;

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const stage of STAGE_ORDER) {
      counts[stage] = candidates.filter((c) => c.stage === stage).length;
    }
    return counts;
  }, [candidates]);

  const NAV_CARDS = [
    {
      href: "/recruiting/pipeline",
      icon: "Users" as const,
      title: "Pipeline",
      description: "Kanban board with candidates across screening, interview, and offer stages",
      stat: active.length,
      statLabel: "active candidates",
    },
    {
      href: "/apps/resume-screener",
      icon: "FileScan" as const,
      title: "Resume Intake",
      description: "Upload and screen resumes against job descriptions using AI",
      stat: stageCounts.screening ?? 0,
      statLabel: "in screening",
    },
    {
      href: "/automations/resume-screener",
      icon: "BarChart3" as const,
      title: "Screening Analytics",
      description: "Run history, success rates, and screening performance metrics",
      stat: `${acceptanceRate}%`,
      statLabel: "acceptance rate",
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Recruiting"
        subtitle="Candidate pipeline, screening, and hiring analytics"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Recruiting" },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/apps/resume-screener">
              <Icon type="FileScan" size="xs" />
              Screen Resume
            </Link>
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
            <Skeleton className="h-24 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Users" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Total Screened</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5">{total}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Target" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted" className="font-medium">Acceptance Rate</Text>
                </div>
                <Text className={`text-lg font-bold mt-0.5 ${acceptanceRate >= 70 ? "text-success" : acceptanceRate >= 40 ? "text-warning" : "text-destructive"}`}>
                  {acceptanceRate}%
                </Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="CircleCheck" size="xs" className="text-success" />
                  <Text level="xSmall" color="muted" className="font-medium">On Track</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-success">{slaOnTrack}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="Clock" size="xs" className="text-warning" />
                  <Text level="xSmall" color="muted" className="font-medium">At Risk</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-warning">{slaAtRisk}</Text>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Icon type="AlertTriangle" size="xs" className="text-destructive" />
                  <Text level="xSmall" color="muted" className="font-medium">SLA Breached</Text>
                </div>
                <Text className="text-lg font-bold mt-0.5 text-destructive">{slaBreached}</Text>
              </div>
            </div>

            {/* Stage summary strip */}
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon type="Activity" size="sm" className="text-muted-foreground" />
                <Text className="font-semibold">Stage Distribution</Text>
              </div>
              <div className="flex items-stretch gap-0">
                {STAGE_ORDER.map((stage, i) => (
                  <div key={stage} className="flex items-stretch flex-1 min-w-0">
                    <div className="flex-1 rounded-lg border border-border p-3 text-center">
                      <Text level="xSmall" color="muted" className="font-medium truncate block">{STAGE_LABELS[stage]}</Text>
                      <Text className="text-xl font-bold mt-0.5">{stageCounts[stage] ?? 0}</Text>
                    </div>
                    {i < STAGE_ORDER.length - 1 && (
                      <div className="flex items-center px-1">
                        <Icon type="ChevronRight" size="xs" className="text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex items-stretch min-w-0">
                  <div className="flex items-center px-1">
                    <Icon type="ChevronRight" size="xs" className="text-muted-foreground/50" />
                  </div>
                  <div className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                    <Text level="xSmall" color="muted" className="font-medium">Rejected</Text>
                    <Text className="text-xl font-bold mt-0.5 text-destructive">{rejected}</Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {NAV_CARDS.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="rounded-xl border border-border bg-background p-5 space-y-3 transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon type={card.icon as never} size="sm" className="text-primary" />
                    </div>
                    <Text className="font-semibold">{card.title}</Text>
                  </div>
                  <Text level="small" color="muted">{card.description}</Text>
                  <div className="flex items-baseline gap-1.5">
                    <Text className="text-xl font-bold">{card.stat}</Text>
                    <Text level="xSmall" color="muted">{card.statLabel}</Text>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
