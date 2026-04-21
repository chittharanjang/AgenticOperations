"use client";

import { InsightsCard } from "@kognitos/lattice";
import type { RunState } from "@/lib/types";

interface Run {
  id: string;
  status: RunState;
  create_time: string;
  update_time?: string;
}

export function AutomationMetrics({ runs }: { runs: Run[] }) {
  const total = runs.length;
  const completed = runs.filter((r) => r.status === "completed").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const awaiting = runs.filter((r) => r.status === "awaiting_guidance").length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <InsightsCard title="Total Runs" value={total.toString()} />
      <InsightsCard title="Completed" value={completed.toString()} />
      <InsightsCard title="Failed" value={failed.toString()} />
      <InsightsCard
        title="Success Rate"
        value={total > 0 ? `${successRate}%` : "—"}
      />
    </div>
  );
}
