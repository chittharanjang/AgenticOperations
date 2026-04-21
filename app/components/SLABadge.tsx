"use client";

import { Badge } from "@kognitos/lattice";
import type { SLAStatus } from "@/lib/sla";

const CONFIG: Record<SLAStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  on_track: { label: "On Track", variant: "success" },
  at_risk: { label: "At Risk", variant: "warning" },
  breached: { label: "SLA Breached", variant: "destructive" },
};

interface SLABadgeProps {
  status: SLAStatus;
  detail?: string;
  compact?: boolean;
}

export function SLABadge({ status, detail, compact }: SLABadgeProps) {
  const { label, variant } = CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5" title={detail}>
      <span
        className={`inline-block h-2 w-2 rounded-full shrink-0 ${
          status === "on_track"
            ? "bg-success"
            : status === "at_risk"
              ? "bg-warning"
              : "bg-destructive"
        }`}
      />
      {!compact && (
        <Badge variant={variant} className="text-xs">
          {label}
        </Badge>
      )}
    </span>
  );
}
