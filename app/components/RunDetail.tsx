"use client";

import { Text, Badge } from "@kognitos/lattice";
import type { RunRow } from "./RunsTable";

export function RunDetail({ run }: { run: RunRow }) {
  const outputEntries = Object.entries(run.outputs);
  const inputEntries = Object.entries(run.user_inputs ?? {});

  return (
    <div className="bg-muted/20 border-t border-border px-6 py-4 space-y-4">
      {run.error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <Text level="small" className="text-destructive">
            {run.error}
          </Text>
        </div>
      )}

      {inputEntries.length > 0 && (
        <div>
          <Text level="xSmall" color="muted" className="mb-2 font-medium uppercase tracking-wider">
            Inputs
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inputEntries.map(([key, val]) => (
              <div
                key={key}
                className="flex items-baseline gap-2 rounded-md bg-background p-2 border border-border"
              >
                <Badge variant="secondary">{key}</Badge>
                <Text level="small" className="truncate">
                  {val.text ?? "—"}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {outputEntries.length > 0 && (
        <div>
          <Text level="xSmall" color="muted" className="mb-2 font-medium uppercase tracking-wider">
            Outputs
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {outputEntries.map(([key, val]) => (
              <div
                key={key}
                className="flex items-baseline gap-2 rounded-md bg-background p-2 border border-border"
              >
                <Badge variant="secondary">{key}</Badge>
                <Text level="small" className="truncate">
                  {typeof val === "string" ? val : JSON.stringify(val)}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {outputEntries.length === 0 && inputEntries.length === 0 && !run.error && (
        <Text level="small" color="muted">
          No additional details available for this run.
        </Text>
      )}

      <div className="pt-2 border-t border-border">
        <Text level="xSmall" color="muted">
          Run ID: {run.id}
        </Text>
      </div>
    </div>
  );
}
