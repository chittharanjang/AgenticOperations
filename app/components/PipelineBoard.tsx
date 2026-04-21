"use client";

import { useState } from "react";
import { Text, Icon, Badge } from "@kognitos/lattice";
import type { Candidate, PipelineStage } from "@/lib/sample-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/sample-data";
import { getSLAStatusForStage } from "@/lib/sla";
import { CandidateCard } from "./CandidateCard";
import { CandidateDrawer } from "./CandidateDrawer";

const VISIBLE_STAGES: PipelineStage[] = STAGE_ORDER;

interface PipelineBoardProps {
  candidates: Candidate[];
  showRejected?: boolean;
  onAdvanceStage?: (candidateId: string) => Promise<{ ok: boolean; error?: string }>;
  onReject?: (candidateId: string, reason: string) => void;
}

export function PipelineBoard({
  candidates,
  showRejected,
  onAdvanceStage,
  onReject,
}: PipelineBoardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const columns = VISIBLE_STAGES.map((stage) => {
    const items = candidates.filter((c) => c.stage === stage);
    const breachedCount = items.filter(
      (c) => getSLAStatusForStage(c.stage, c.stageEnteredAt) === "breached"
    ).length;
    return { stage, items, breachedCount };
  });

  const rejected = candidates.filter((c) => c.stage === "rejected");

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {columns.map(({ stage, items, breachedCount }) => (
            <div
              key={stage}
              className="min-w-0 rounded-lg border border-border bg-muted/20 flex flex-col"
            >
              {/* Column header */}
              <div className="px-3 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Text level="small" className="font-semibold truncate">{STAGE_LABELS[stage]}</Text>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {items.length}
                  </Badge>
                </div>
                {breachedCount > 0 && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    {breachedCount} overdue
                  </Badge>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 flex-1 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <Text level="xSmall" color="muted">No candidates</Text>
                  </div>
                ) : (
                  items.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      onClick={() => setSelectedCandidate(c)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}

          {/* Rejected column */}
          {showRejected && rejected.length > 0 && (
            <div className="min-w-0 rounded-lg border border-destructive/30 bg-destructive/5 flex flex-col">
              <div className="px-3 py-3 border-b border-destructive/20 flex items-center gap-2">
                <Icon type="X" size="sm" className="text-destructive" />
                <Text level="small" className="font-semibold">Rejected</Text>
                <Badge variant="destructive" className="text-xs">
                  {rejected.length}
                </Badge>
              </div>
              <div className="p-2 space-y-2 flex-1 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {rejected.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onClick={() => setSelectedCandidate(c)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onAdvanceStage={onAdvanceStage}
        onReject={onReject}
      />
    </>
  );
}
