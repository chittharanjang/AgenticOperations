import { NextResponse } from "next/server";
import { computeTicketSLASummaries, type TicketSLAKey } from "@/lib/sla";
import type { TicketWithSLA } from "@/app/api/tickets/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  let tickets: TicketWithSLA[] = [];
  try {
    const res = await fetch(`${origin}/api/tickets`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      tickets = data.tickets ?? [];
    }
  } catch {
    /* fall through with empty */
  }

  const summaries = computeTicketSLASummaries(
    tickets,
    (t) => t.type as TicketSLAKey,
    (t) => t.processingTimeMs,
    (t) => t.createdAt,
    (t) => t.completedAt,
  );

  const overall = {
    totalTickets: summaries.reduce((s, x) => s + x.totalTickets, 0),
    completedTickets: summaries.reduce((s, x) => s + x.completedTickets, 0),
    totalBreached: summaries.reduce((s, x) => s + x.breached, 0),
    totalAtRisk: summaries.reduce((s, x) => s + x.atRisk, 0),
    overallCompliance:
      summaries.reduce((s, x) => s + x.completedTickets, 0) > 0
        ? Math.round(
            (summaries.reduce((s, x) => s + x.withinSLA, 0) /
              summaries.reduce((s, x) => s + x.completedTickets, 0)) *
              100,
          )
        : 100,
  };

  return NextResponse.json({ summaries, overall });
}
