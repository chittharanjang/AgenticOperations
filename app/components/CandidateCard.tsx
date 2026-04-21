"use client";

import { Text, Badge, Icon, Spinner } from "@kognitos/lattice";
import type { Candidate } from "@/lib/sample-data";
import { getSLAStatusForStage, getElapsedMs, formatDuration, PIPELINE_SLAS, getSLARemainingLabel } from "@/lib/sla";
import { SLABadge } from "./SLABadge";

const SCORE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  const slaStatus = getSLAStatusForStage(candidate.stage, candidate.stageEnteredAt);
  const elapsed = getElapsedMs(candidate.stageEnteredAt);
  const slaDef = PIPELINE_SLAS[candidate.stage];
  const slaDetail = slaDef ? getSLARemainingLabel(elapsed, slaDef) : undefined;

  const isProcessing =
    candidate.runStatus === "executing" || candidate.runStatus === "pending";
  const isStuck = candidate.runStatus === "awaiting_guidance";

  if (isProcessing) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2 transition-all hover:shadow-md hover:border-primary/50"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Spinner className="h-3.5 w-3.5 text-primary shrink-0" />
            <Text level="small" className="font-medium text-primary truncate">
              Screening in progress
            </Text>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0 animate-pulse">
            running
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="h-3 w-3/4 rounded bg-primary/10 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-primary/10 animate-pulse" />
        </div>

        <div className="flex items-center gap-1">
          <Icon type="Clock" size="xs" className="text-muted-foreground" />
          <Text level="xSmall" color="muted">
            Started {formatDuration(elapsed)} ago
          </Text>
        </div>
      </button>
    );
  }

  if (isStuck) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left rounded-lg border border-warning/40 bg-warning/5 p-3 space-y-2 transition-all hover:shadow-md hover:border-warning/60"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon type="AlertTriangle" size="xs" className="text-warning shrink-0" />
            <Text level="small" className="font-medium truncate">
              {candidate.name}
            </Text>
          </div>
          <Badge variant="warning" className="text-xs shrink-0">
            needs attention
          </Badge>
        </div>

        <Text level="xSmall" color="muted" className="truncate">
          {candidate.rejectionReason || "Exception during screening"}
        </Text>

        <div className="flex items-center gap-1">
          <Icon type="Clock" size="xs" className="text-muted-foreground" />
          <Text level="xSmall" color="muted">
            {formatDuration(elapsed)}
          </Text>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 space-y-2 transition-all hover:shadow-md hover:border-primary/40 ${
        slaStatus === "breached"
          ? "border-destructive/40 bg-destructive/5"
          : slaStatus === "at_risk"
            ? "border-warning/40 bg-warning/5"
            : "border-border bg-background"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Text level="small" className="font-medium truncate">
          {candidate.name}
        </Text>
        <Badge variant={SCORE_VARIANT[candidate.relevanceScore]} className="text-xs shrink-0">
          {candidate.relevanceScore}
        </Badge>
      </div>

      <Text level="xSmall" color="muted" className="truncate">
        {candidate.role}
      </Text>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Icon type="Clock" size="xs" className="text-muted-foreground" />
          <Text level="xSmall" color="muted">
            {formatDuration(elapsed)}
          </Text>
        </div>
        <SLABadge status={slaStatus} detail={slaDetail} compact />
      </div>
    </button>
  );
}
