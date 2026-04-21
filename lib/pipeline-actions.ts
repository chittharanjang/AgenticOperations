import type { PipelineStage, Candidate } from "./sample-data";
import { STAGE_ORDER, STAGE_LABELS } from "./sample-data";

const CALL_SCHEDULING_ID = "Bw4Hy2zzjrYIRZ72C6xCA";
const INTERVIEW_SCHEDULING_ID = "G4nJADaCneq0h2tLHwGlX";

export interface StageTransition {
  from: PipelineStage;
  to: PipelineStage;
  automationId: string | null;
  buildInputs: (candidate: Candidate) => Record<string, unknown>;
}

const STAGE_AUTOMATION_MAP: Partial<Record<PipelineStage, StageTransition>> = {
  screening_passed: {
    from: "screening_passed",
    to: "interview",
    automationId: CALL_SCHEDULING_ID,
    buildInputs: (c) => ({
      candidate_name: { text: c.name },
      email: { text: c.email },
      candidate_status: { text: "Open" },
      role: { text: c.role },
      job_opening_id: { text: c.jobOpeningId },
      screening_summary: { text: c.rejectionReason || "" },
    }),
  },
  interview: {
    from: "interview",
    to: "offer",
    automationId: INTERVIEW_SCHEDULING_ID,
    buildInputs: (c) => ({
      candidate_name: { text: c.name },
      email: { text: c.email },
      role: { text: c.role },
      job_opening_id: { text: c.jobOpeningId },
    }),
  },
};

export function getNextStage(current: PipelineStage): PipelineStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function getStageTransition(stage: PipelineStage): StageTransition | null {
  return STAGE_AUTOMATION_MAP[stage] ?? null;
}

export function getAutomationIdForStage(stage: PipelineStage): string | null {
  return STAGE_AUTOMATION_MAP[stage]?.automationId ?? null;
}

export function advanceCandidate(candidate: Candidate): Candidate | null {
  const nextStage = getNextStage(candidate.stage);
  if (!nextStage) return null;

  const now = new Date().toISOString();
  const updates: Partial<Candidate> = {
    stage: nextStage,
    stageEnteredAt: now,
  };

  if (nextStage === "screening_passed" && !candidate.screeningCompletedAt) {
    updates.screeningCompletedAt = now;
  }

  return { ...candidate, ...updates };
}

export function rejectCandidate(candidate: Candidate, reason: string): Candidate {
  return {
    ...candidate,
    stage: "rejected" as PipelineStage,
    stageEnteredAt: new Date().toISOString(),
    rejectionReason: reason,
  };
}
