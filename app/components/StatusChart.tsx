"use client";

import { Title } from "@kognitos/lattice";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { RunState } from "@/lib/types";

const STATUS_COLORS: Record<RunState, string> = {
  completed: "var(--chart-2)",
  failed: "var(--chart-1)",
  awaiting_guidance: "var(--chart-3)",
  executing: "var(--chart-4)",
  pending: "var(--chart-5)",
  stopped: "var(--chart-6)",
};

const STATUS_LABELS: Record<RunState, string> = {
  completed: "Completed",
  failed: "Failed",
  awaiting_guidance: "Awaiting Guidance",
  executing: "Executing",
  pending: "Pending",
  stopped: "Stopped",
};

interface Run {
  status: RunState;
}

export function StatusChart({ runs }: { runs: Run[] }) {
  if (runs.length === 0) return null;

  const counts: Partial<Record<RunState, number>> = {};
  for (const run of runs) {
    counts[run.status] = (counts[run.status] ?? 0) + 1;
  }

  const data = Object.entries(counts).map(([status, count]) => ({
    name: STATUS_LABELS[status as RunState],
    value: count,
    status: status as RunState,
  }));

  return (
    <div>
      <Title level="h4" className="mb-3">
        Status Breakdown
      </Title>
      <div className="rounded-lg border border-border p-4 bg-background">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name} (${value})`}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
