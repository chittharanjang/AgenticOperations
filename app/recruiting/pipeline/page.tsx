"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Title, Text, Icon, Badge, Button, Skeleton, Spinner } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { PipelineBoard } from "@/app/components/PipelineBoard";
import { SLABadge } from "@/app/components/SLABadge";
import {
  SAMPLE_CANDIDATES,
  STAGE_ORDER,
  STAGE_LABELS,
  type Candidate,
  type PipelineStage,
} from "@/lib/sample-data";
import {
  getSLAStatusForStage,
  getElapsedMs,
  formatDuration,
  PIPELINE_SLAS,
} from "@/lib/sla";
import {
  advanceCandidate,
  rejectCandidate,
  getStageTransition,
  getNextStage,
} from "@/lib/pipeline-actions";

type FilterMode = "all" | "on_track" | "at_risk" | "breached";

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"api" | "sample">("api");
  const [filterSLA, setFilterSLA] = useState<FilterMode>("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchCandidates() {
      try {
        const res = await fetch("/api/pipeline/candidates");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const fetched: Candidate[] = data.candidates ?? [];
        if (fetched.length > 0) {
          setCandidates(fetched);
          setDataSource("api");
        } else {
          setCandidates(SAMPLE_CANDIDATES);
          setDataSource("sample");
        }
      } catch {
        if (cancelled) return;
        setCandidates(SAMPLE_CANDIDATES);
        setDataSource("sample");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCandidates();
    return () => { cancelled = true; };
  }, []);

  const activeCandidates = candidates.filter((c) => c.stage !== "rejected");
  const rejectedCount = candidates.filter((c) => c.stage === "rejected").length;

  const filtered = useMemo(() => {
    if (filterSLA === "all") return candidates;
    return candidates.filter((c) => {
      if (c.stage === "rejected") return true;
      return getSLAStatusForStage(c.stage, c.stageEnteredAt) === filterSLA;
    });
  }, [candidates, filterSLA]);

  const handleAdvanceStage = useCallback(
    async (candidateId: string): Promise<{ ok: boolean; error?: string }> => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return { ok: false, error: "Candidate not found" };

      const transition = getStageTransition(candidate.stage);

      if (transition?.automationId) {
        try {
          const res = await fetch(
            `/api/automations/${transition.automationId}/invoke`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                inputs: transition.buildInputs(candidate),
                poll: true,
              }),
            }
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
              ok: false,
              error: (data as { error?: string }).error ?? `Invoke failed (${res.status})`,
            };
          }
          const data = await res.json();
          if (data.status === "failed") {
            return { ok: false, error: data.error ?? "Automation failed" };
          }
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : "Network error",
          };
        }
      }

      const updated = advanceCandidate(candidate);
      if (!updated) return { ok: false, error: "Already at final stage" };

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? updated : c))
      );
      return { ok: true };
    },
    [candidates]
  );

  const handleReject = useCallback(
    (candidateId: string, reason: string) => {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? rejectCandidate(c, reason) : c
        )
      );
    },
    []
  );

  const totalCandidates = candidates.length;
  const slaBreached = activeCandidates.filter(
    (c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "breached"
  ).length;
  const slaAtRisk = activeCandidates.filter(
    (c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "at_risk"
  ).length;
  const slaOnTrack = activeCandidates.filter(
    (c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "on_track"
  ).length;

  const bottleneckStage = useMemo(() => {
    let maxAvg = 0;
    let worst: PipelineStage | null = null;
    for (const stage of STAGE_ORDER) {
      const inStage = activeCandidates.filter((c) => c.stage === stage);
      if (inStage.length === 0) continue;
      const avg = inStage.reduce((sum, c) => sum + getElapsedMs(c.stageEnteredAt), 0) / inStage.length;
      if (avg > maxAvg) {
        maxAvg = avg;
        worst = stage;
      }
    }
    return worst ? { stage: worst, avgTime: maxAvg } : null;
  }, [activeCandidates]);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title="Recruiting Pipeline"
          subtitle="Loading candidates..."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Recruiting", href: "/recruiting" },
            { label: "Pipeline" },
          ]}
        />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <div className="flex items-center justify-center py-16 gap-3">
            <Spinner className="h-5 w-5" />
            <Text color="muted">Fetching candidates from Resume Screener...</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Recruiting Pipeline"
        subtitle={`${totalCandidates} candidates — ${activeCandidates.length} active, ${rejectedCount} rejected`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Recruiting", href: "/recruiting" },
          { label: "Pipeline" },
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
        {dataSource === "sample" && (
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 flex items-center gap-3">
            <Icon type="Info" size="sm" className="text-muted-foreground shrink-0" />
            <Text level="small" color="muted">
              Showing sample data — no completed screenings found.{" "}
              <a href="/apps/resume-screener" className="underline underline-offset-4 text-primary">
                Screen a resume
              </a>{" "}
              to see real candidates here.
            </Text>
          </div>
        )}

        {/* Bottleneck + Filter bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {(["all", "on_track", "at_risk", "breached"] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterSLA(mode)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterSLA === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                {mode === "all" ? `All (${totalCandidates})` : mode === "on_track" ? `On Track (${slaOnTrack})` : mode === "at_risk" ? `At Risk (${slaAtRisk})` : `Breached (${slaBreached})`}
              </button>
            ))}
          </div>
          {bottleneckStage && (
            <div className="flex items-center gap-2 text-sm">
              <Icon type="AlertTriangle" size="xs" className="text-warning" />
              <Text level="xSmall" color="muted">
                <span className="font-medium text-foreground">Bottleneck:</span>{" "}
                {STAGE_LABELS[bottleneckStage.stage]} — avg. {formatDuration(bottleneckStage.avgTime)}
              </Text>
            </div>
          )}
        </div>

        <PipelineBoard
          candidates={filtered}
          showRejected={true}
          onAdvanceStage={handleAdvanceStage}
          onReject={handleReject}
        />
      </div>
    </div>
  );
}
