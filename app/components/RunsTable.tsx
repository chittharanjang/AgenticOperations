"use client";

import { useState } from "react";
import { Title, Text } from "@kognitos/lattice";
import { RunStatusBadge } from "./RunStatusBadge";
import { RunDetail } from "./RunDetail";
import type { RunState } from "@/lib/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export interface RunRow {
  id: string;
  status: RunState;
  create_time: string;
  update_time?: string;
  outputs: Record<string, unknown>;
  error?: string;
  user_inputs?: Record<string, { text?: string }>;
}

export function RunsTable({ runs }: { runs: RunRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (runs.length === 0) {
    return null;
  }

  function computeDuration(run: RunRow): string {
    if (!run.update_time) return "—";
    const start = new Date(run.create_time).getTime();
    const end = new Date(run.update_time).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}m ${remainder}s`;
  }

  function getOutputPreview(outputs: Record<string, unknown>): string {
    const entries = Object.entries(outputs);
    if (entries.length === 0) return "—";
    return entries
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join(", ");
  }

  return (
    <div>
      <Title level="h4" className="mb-3">
        Run History
      </Title>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3">
                <Text level="xSmall" color="muted">Time</Text>
              </th>
              <th className="text-left px-4 py-3">
                <Text level="xSmall" color="muted">Status</Text>
              </th>
              <th className="text-left px-4 py-3">
                <Text level="xSmall" color="muted">Duration</Text>
              </th>
              <th className="text-left px-4 py-3">
                <Text level="xSmall" color="muted">Outputs</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <>
                <tr
                  key={run.id}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === run.id ? null : run.id)
                  }
                >
                  <td className="px-4 py-3">
                    <Text level="small">
                      {dayjs(run.create_time).format("MMM D, YYYY h:mm A")}
                    </Text>
                    <Text level="xSmall" color="muted">
                      {dayjs(run.create_time).fromNow()}
                    </Text>
                  </td>
                  <td className="px-4 py-3">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Text level="small">{computeDuration(run)}</Text>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <Text level="small" color="muted">
                      {getOutputPreview(run.outputs)}
                    </Text>
                  </td>
                </tr>
                {expandedId === run.id && (
                  <tr key={`${run.id}-detail`}>
                    <td colSpan={4} className="p-0">
                      <RunDetail run={run} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
