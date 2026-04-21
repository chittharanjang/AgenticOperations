"use client";

import { Text, Badge } from "@kognitos/lattice";

interface RunOutputsProps {
  outputs: Record<string, unknown>;
}

export function RunOutputs({ outputs }: RunOutputsProps) {
  const entries = Object.entries(outputs);

  if (entries.length === 0) {
    return (
      <Text level="small" color="muted">
        No outputs returned.
      </Text>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, val]) => {
        const display = typeof val === "string" ? val : JSON.stringify(val, null, 2);
        const isHighlight =
          key.toLowerCase().includes("score") ||
          key.toLowerCase().includes("status");

        return (
          <div
            key={key}
            className="rounded-lg border border-border bg-background p-4 space-y-1"
          >
            <Text level="xSmall" color="muted" className="uppercase tracking-wider font-medium">
              {key.replace(/_/g, " ")}
            </Text>
            {isHighlight ? (
              <div className="pt-1">
                <Badge
                  variant={
                    display.toLowerCase().includes("high") || display.toLowerCase() === "open"
                      ? "success"
                      : display.toLowerCase().includes("low") || display.toLowerCase().includes("reject")
                        ? "destructive"
                        : "warning"
                  }
                >
                  {display}
                </Badge>
              </div>
            ) : (
              <Text level="small" className="font-medium break-words">
                {display}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
}
