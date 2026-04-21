import { NextResponse } from "next/server";
import { req, ORG_ID, WORKSPACE_ID, parseOutputValue, extractExceptionMessage } from "@/lib/kognitos";
import { JOB_OPENING_TITLES } from "@/lib/job-openings";
import type { Candidate, PipelineStage } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

const RESUME_SCREENER_ID = "GtFXF0HQwBURCB9pB0Se4";

function str(outputs: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = outputs[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function mapRelevanceScore(raw: string): "high" | "medium" | "low" {
  const lower = raw.toLowerCase();
  if (lower === "high") return "high";
  if (lower === "low") return "low";
  return "medium";
}

function mapStage(candidateStatus: string, runStatus: string): PipelineStage {
  if (runStatus === "executing" || runStatus === "pending") return "screening";
  if (runStatus === "awaiting_guidance") return "screening";
  if (runStatus === "failed") return "rejected";

  const lower = candidateStatus.toLowerCase();
  if (lower === "open" || lower === "accepted") return "screening_passed";
  if (lower.includes("reject")) return "rejected";
  // "Manual Review Needed" or anything else stays in screening
  return "screening";
}

interface RawRun {
  name: string;
  create_time: string;
  update_time?: string;
  state: Record<string, unknown>;
  user_inputs?: Record<string, { text?: string }>;
}

function runToCandidate(run: RawRun): Candidate | null {
  const runId = run.name.split("/").pop() ?? "";
  const completedState = run.state.completed as
    | { outputs?: Record<string, Record<string, unknown>>; update_time?: string }
    | undefined;

  const runStatus = run.state.completed
    ? "completed"
    : run.state.failed
      ? "failed"
      : run.state.awaiting_guidance
        ? "awaiting_guidance"
        : run.state.executing
          ? "executing"
          : "pending";

  const outputs: Record<string, unknown> = {};
  if (completedState?.outputs) {
    for (const [key, val] of Object.entries(completedState.outputs)) {
      outputs[key] = parseOutputValue(val);
    }
  }

  const name = str(outputs, "candidate_name");
  // Skip runs with no candidate output (non-completed or empty results)
  if (!name && runStatus === "completed") return null;

  const score = str(outputs, "relevance_score");
  const status = str(outputs, "candidate_status");
  const applicantId = str(outputs, "applicant_id");

  let email = str(outputs, "email", "candidate_email");
  if (!email && applicantId) {
    const emailMatch = applicantId.match(/^(.+@.+\..+)-\d+$/);
    if (emailMatch) email = emailMatch[1];
  }
  if (!email) email = "N/A";
  const jobOpeningId =
    str(outputs, "job_opening_id", "Job Opening ID") ||
    run.user_inputs?.["Job Opening ID"]?.text ||
    "";
  const role =
    str(outputs, "job_title", "position", "role") ||
    JOB_OPENING_TITLES[jobOpeningId] ||
    "Unknown";

  const guidanceState = run.state.awaiting_guidance as
    | { exception?: string; description?: string }
    | undefined;

  let rejectionReason: string | undefined;
  if (runStatus === "failed") {
    rejectionReason =
      (run.state.failed as { error?: { description?: string } })?.error
        ?.description ?? "Screening failed";
  } else if (runStatus === "awaiting_guidance") {
    const desc = guidanceState?.description;
    rejectionReason = desc
      ? extractExceptionMessage(desc)
      : "Needs attention";
  } else if (status.toLowerCase().includes("reject")) {
    rejectionReason =
      str(outputs, "review_reason", "recommendation", "screening_summary") ||
      undefined;
  }

  return {
    id: applicantId || `RUN-${runId.slice(0, 8)}`,
    name: name || "Processing…",
    email,
    role,
    stage: mapStage(status, runStatus),
    relevanceScore: score ? mapRelevanceScore(score) : "medium",
    stageEnteredAt: completedState?.update_time ?? run.update_time ?? run.create_time,
    resumeReceivedAt: run.create_time,
    screeningCompletedAt:
      runStatus === "completed"
        ? (completedState?.update_time ?? run.update_time ?? run.create_time)
        : undefined,
    rejectionReason,
    jobOpeningId,
    runStatus: runStatus as Candidate["runStatus"],
  };
}

export async function GET() {
  try {
    const res = await req(
      `/organizations/${ORG_ID}/workspaces/${WORKSPACE_ID}/automations/${RESUME_SCREENER_ID}/runs?pageSize=100`
    );

    if (!res.ok) {
      return NextResponse.json(
        { candidates: [], error: `Kognitos API error: ${res.status}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    const runs: RawRun[] = data.runs ?? [];

    const allCandidates: Candidate[] = [];
    for (const run of runs) {
      const candidate = runToCandidate(run);
      if (candidate) allCandidates.push(candidate);
    }

    // Deduplicate by email — keep the latest run (first in the array since API returns newest first)
    const seen = new Map<string, Candidate>();
    for (const c of allCandidates) {
      const key = c.email.toLowerCase();
      if (key === "n/a" || !seen.has(key)) {
        seen.set(key, c);
      }
    }

    return NextResponse.json({ candidates: Array.from(seen.values()) });
  } catch (err) {
    console.error("[pipeline/candidates] Error:", err);
    return NextResponse.json(
      {
        candidates: [],
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
