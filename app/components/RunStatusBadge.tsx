"use client";

import { Badge } from "@kognitos/lattice";
import type { RunState } from "@/lib/types";

const STATUS_CONFIG: Record<
  RunState,
  { label: string; variant: "success" | "destructive" | "warning" | "secondary" }
> = {
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  awaiting_guidance: { label: "Awaiting Guidance", variant: "warning" },
  executing: { label: "Executing", variant: "warning" },
  pending: { label: "Pending", variant: "secondary" },
  stopped: { label: "Stopped", variant: "secondary" },
};

export function RunStatusBadge({ status }: { status: RunState }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
