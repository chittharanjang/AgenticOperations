"use client";

import { useState } from "react";
import { Text, Title, Badge, Icon, Button, Spinner } from "@kognitos/lattice";
import type { Candidate } from "@/lib/sample-data";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/sample-data";
import {
  getSLAStatusForStage,
  getElapsedMs,
  formatDuration,
  PIPELINE_SLAS,
  getSLARemainingLabel,
} from "@/lib/sla";
import { getNextStage, getAutomationIdForStage } from "@/lib/pipeline-actions";
import { SLABadge } from "./SLABadge";
import dayjs from "dayjs";

const SCORE_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  high: "success",
  medium: "warning",
  low: "destructive",
};

type DrawerView = "detail" | "confirm_advance" | "confirm_reject";

interface CandidateDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onAdvanceStage?: (candidateId: string) => Promise<{ ok: boolean; error?: string }>;
  onReject?: (candidateId: string, reason: string) => void;
}

export function CandidateDrawer({
  candidate,
  onClose,
  onAdvanceStage,
  onReject,
}: CandidateDrawerProps) {
  const [view, setView] = useState<DrawerView>("detail");
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (!candidate) return null;

  const slaStatus = getSLAStatusForStage(candidate.stage, candidate.stageEnteredAt);
  const elapsed = getElapsedMs(candidate.stageEnteredAt);
  const slaDef = PIPELINE_SLAS[candidate.stage];
  const slaDetail = slaDef ? getSLARemainingLabel(elapsed, slaDef) : undefined;

  const currentStageIdx = STAGE_ORDER.indexOf(candidate.stage);
  const isRejected = candidate.stage === "rejected";
  const nextStage = getNextStage(candidate.stage);
  const automationId = getAutomationIdForStage(candidate.stage);
  const isProcessing =
    candidate.runStatus === "executing" || candidate.runStatus === "pending";
  const isStuck = candidate.runStatus === "awaiting_guidance";

  const timeline = [
    { label: "Resume Received", time: candidate.resumeReceivedAt, done: true },
    { label: "Screening Completed", time: candidate.screeningCompletedAt, done: !!candidate.screeningCompletedAt },
  ];

  function handleClose() {
    setView("detail");
    setAdvanceError(null);
    setRejectReason("");
    onClose();
  }

  async function handleConfirmAdvance() {
    if (!onAdvanceStage || advancing || !candidate) return;
    setAdvancing(true);
    setAdvanceError(null);

    const result = await onAdvanceStage(candidate.id);

    setAdvancing(false);
    if (result.ok) {
      handleClose();
    } else {
      setAdvanceError(result.error ?? "Failed to advance stage");
    }
  }

  function handleConfirmReject() {
    if (!onReject || !rejectReason.trim() || !candidate) return;
    onReject(candidate.id, rejectReason.trim());
    handleClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background border-l border-border shadow-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`rounded-full p-2.5 shrink-0 ${
              isProcessing ? "bg-primary/10" : isStuck ? "bg-warning/10" : "bg-primary/10"
            }`}>
              {isProcessing ? (
                <Spinner className="h-5 w-5 text-primary" />
              ) : isStuck ? (
                <Icon type="AlertTriangle" size="md" className="text-warning" />
              ) : (
                <Icon type="User" size="md" className="text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <Title level="h4" className="truncate">
                {isProcessing ? "Screening in Progress" : candidate.name}
              </Title>
              <Text level="xSmall" color="muted">{candidate.id}</Text>
            </div>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-muted transition-colors">
            <Icon type="X" size="sm" className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Confirmation: Advance Stage */}
          {view === "confirm_advance" && nextStage && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Icon type="ChevronRight" size="sm" className="text-primary" />
                <Text className="font-semibold">Confirm Stage Advancement</Text>
              </div>
              <Text level="small">
                Move <span className="font-semibold">{candidate.name}</span> from{" "}
                <Badge variant="secondary" className="text-xs">{STAGE_LABELS[candidate.stage]}</Badge>
                {" "}to{" "}
                <Badge variant="secondary" className="text-xs">{STAGE_LABELS[nextStage]}</Badge>?
              </Text>
              {automationId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon type="Sparkles" size="xs" />
                  <span>This will invoke a Kognitos automation</span>
                </div>
              )}
              {advanceError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <Text level="xSmall" className="text-destructive">{advanceError}</Text>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirmAdvance}
                  disabled={advancing}
                  className="flex-1"
                >
                  {advancing ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Advancing…
                    </>
                  ) : (
                    <>
                      <Icon type="Check" size="sm" />
                      Confirm
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setView("detail"); setAdvanceError(null); }}
                  disabled={advancing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation: Reject */}
          {view === "confirm_reject" && (
            <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Icon type="X" size="sm" className="text-destructive" />
                <Text className="font-semibold">Reject Candidate</Text>
              </div>
              <Text level="small">
                Reject <span className="font-semibold">{candidate.name}</span> from the pipeline?
              </Text>
              <div className="space-y-1.5">
                <Text level="xSmall" color="muted" className="font-medium">Reason (required)</Text>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason…"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1"
                >
                  <Icon type="X" size="sm" />
                  Reject Candidate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setView("detail"); setRejectReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* In-progress banner */}
          {isProcessing && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-primary shrink-0" />
                <Text level="small" className="font-semibold text-primary">
                  Resume is being screened
                </Text>
              </div>
              <Text level="xSmall" color="muted">
                The automation is reviewing this resume. Candidate details, relevance score, and
                screening results will appear here once processing completes.
              </Text>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <Icon type="Clock" size="xs" className="text-muted-foreground" />
                  <Text level="xSmall" color="muted">
                    Running for {formatDuration(elapsed)}
                  </Text>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-primary/40 animate-pulse" />
              </div>
            </div>
          )}

          {/* Stuck / awaiting guidance banner */}
          {isStuck && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon type="AlertTriangle" size="sm" className="text-warning shrink-0" />
                <Text level="small" className="font-semibold">
                  Needs Attention
                </Text>
              </div>
              <Text level="xSmall" color="muted">
                {candidate.rejectionReason || "This run encountered an exception and is waiting for guidance."}
              </Text>
              <Text level="xSmall" color="muted">
                Stuck for {formatDuration(elapsed)}. Resolve the exception in the Kognitos
                platform to continue processing.
              </Text>
            </div>
          )}

          {/* Status strip */}
          <div className="flex items-center gap-3 flex-wrap">
            {isProcessing ? (
              <Badge variant="secondary" className="text-sm animate-pulse">
                Screening
              </Badge>
            ) : (
              <Badge variant={isRejected ? "destructive" : "secondary"} className="text-sm">
                {isRejected ? "Rejected" : STAGE_LABELS[candidate.stage]}
              </Badge>
            )}
            {!isProcessing && (
              <Badge variant={SCORE_VARIANT[candidate.relevanceScore]}>
                {candidate.relevanceScore} relevance
              </Badge>
            )}
            {!isRejected && !isProcessing && <SLABadge status={slaStatus} detail={slaDetail} />}
          </div>

          {/* Details grid */}
          {isProcessing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Text level="xSmall" color="muted" className="font-medium">Candidate</Text>
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <Text level="xSmall" color="muted" className="font-medium">Email</Text>
                <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <Text level="xSmall" color="muted" className="font-medium">Role</Text>
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <Text level="xSmall" color="muted" className="font-medium">Relevance</Text>
                <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text level="xSmall" color="muted" className="font-medium">Role</Text>
                <Text level="small">{candidate.role}</Text>
              </div>
              <div className="space-y-1">
                <Text level="xSmall" color="muted" className="font-medium">Email</Text>
                <Text level="small" className="truncate">{candidate.email}</Text>
              </div>
              <div className="space-y-1">
                <Text level="xSmall" color="muted" className="font-medium">Job Opening</Text>
                <Text level="small" className="font-mono text-xs">{candidate.jobOpeningId}</Text>
              </div>
              <div className="space-y-1">
                <Text level="xSmall" color="muted" className="font-medium">Time in Stage</Text>
                <Text level="small">{formatDuration(elapsed)}</Text>
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {candidate.rejectionReason && !isProcessing && !isStuck && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-1">
              <Text level="xSmall" className="font-medium text-destructive">Rejection Reason</Text>
              <Text level="small">{candidate.rejectionReason}</Text>
            </div>
          )}

          {/* Pipeline progress */}
          <div className="space-y-3">
            <Text level="small" className="font-medium">Pipeline Progress</Text>
            <div className="flex gap-1">
              {STAGE_ORDER.map((stage, idx) => (
                <div
                  key={stage}
                  className={`h-2 flex-1 rounded-full ${
                    isRejected
                      ? idx <= currentStageIdx || currentStageIdx === -1
                        ? "bg-destructive/50"
                        : "bg-muted"
                      : idx <= currentStageIdx
                        ? "bg-primary"
                        : "bg-muted"
                  }`}
                  title={STAGE_LABELS[stage]}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <Text level="xSmall" color="muted">Screening</Text>
              <Text level="xSmall" color="muted">Offer</Text>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <Text level="small" className="font-medium">Timeline</Text>
            <div className="space-y-0">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full border-2 mt-0.5 ${
                        item.done
                          ? "bg-primary border-primary"
                          : "bg-background border-muted-foreground/30"
                      }`}
                    />
                    {idx < timeline.length - 1 && (
                      <div className={`w-0.5 h-8 ${item.done ? "bg-primary/30" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <Text level="small" className={item.done ? "font-medium" : "text-muted-foreground"}>
                      {item.label}
                    </Text>
                    {item.time && (
                      <Text level="xSmall" color="muted">
                        {dayjs(item.time).format("MMM D, YYYY h:mm A")}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interview notes */}
          {candidate.interviewNotes && (
            <div className="space-y-2">
              <Text level="small" className="font-medium">Interview Notes</Text>
              <div className="rounded-lg bg-muted/30 border border-border p-3">
                <Text level="small" color="muted">{candidate.interviewNotes}</Text>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 text-muted-foreground w-full justify-center py-1">
              <Spinner className="h-3.5 w-3.5" />
              <Text level="xSmall" color="muted">
                Actions available after screening completes
              </Text>
            </div>
          )}
          {isStuck && (
            <Text level="xSmall" color="muted" className="w-full text-center py-1">
              Resolve the exception to continue this candidate&apos;s pipeline
            </Text>
          )}
          {!isProcessing && !isStuck && !isRejected && candidate.stage !== "offer" && view === "detail" && (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setView("confirm_advance")}
                disabled={!nextStage}
              >
                <Icon type="ChevronRight" size="sm" />
                Advance Stage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView("confirm_reject")}
              >
                <Icon type="X" size="sm" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
