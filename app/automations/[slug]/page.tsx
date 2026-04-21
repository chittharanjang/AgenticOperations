"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Title, Text, Skeleton, Icon, Badge, Button, InsightsCard, type IconType } from "@kognitos/lattice";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getAutomationBySlug } from "@/lib/automations";
import { AutomationMetrics } from "@/app/components/AutomationMetrics";
import { RunsTable, type RunRow } from "@/app/components/RunsTable";
import { StatusChart } from "@/app/components/StatusChart";
import { PageHeader } from "@/app/components/PageHeader";
import { KognitosIframe } from "@/app/components/KognitosIframe";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface AutomationDetail {
  id: string;
  display_name: string;
  description: string;
  english_code: string;
  connections: unknown[];
}

interface ScreenedCandidate {
  runId: string;
  time: string;
  name: string;
  score: string;
  status: string;
  jobOpening: string;
  summary: string;
}

function extractScreenedCandidate(run: RunRow): ScreenedCandidate | null {
  if (run.status !== "completed" || !run.outputs) return null;
  const o = run.outputs;
  const str = (key: string) => {
    const v = o[key];
    return typeof v === "string" ? v : v != null ? String(v) : "";
  };
  const name = str("candidate_name");
  if (!name) return null;
  return {
    runId: run.id,
    time: run.create_time,
    name,
    score: str("relevance_score") || "—",
    status: str("candidate_status") || "—",
    jobOpening: run.user_inputs?.["Job Opening ID"]?.text ?? "—",
    summary: str("screening_summary") || "",
  };
}

export default function AutomationDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const config = getAutomationBySlug(slug);

  const [automation, setAutomation] = useState<AutomationDetail | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [autoRes, runsRes] = await Promise.all([
          fetch(`/api/automations/${config!.id}`),
          fetch(`/api/automations/${config!.id}/runs`),
        ]);

        if (!autoRes.ok || !runsRes.ok) {
          setError("Failed to load automation data");
          return;
        }

        const autoData = await autoRes.json();
        const runsData = await runsRes.json();

        setAutomation(autoData);
        setRuns(runsData.runs ?? []);
      } catch {
        setError("Network error — could not reach the API");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [config]);

  if (!config) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title="Automation not found"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Not Found" },
          ]}
        />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <Icon type="CircleAlert" size="xl" className="text-destructive" />
            <Text color="muted">
              No automation matches the slug &ldquo;{slug}&rdquo;.
            </Text>
            <Button variant="outline" asChild>
              <Link href="/">
                <Icon type="ArrowLeft" size="sm" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const kognitosUrl = process.env.NEXT_PUBLIC_KOGNITOS_URL;
  const displayName = automation?.display_name ?? config.name;
  const [iframeOpen, setIframeOpen] = useState(false);
  const closeIframe = useCallback(() => setIframeOpen(false), []);

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title={config.name}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: config.name },
          ]}
        />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <PageHeader
          title={config.name}
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: config.name },
          ]}
        />
        <div className="p-6 space-y-6">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <Text className="text-destructive">{error}</Text>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">
              <Icon type="ArrowLeft" size="sm" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (slug === "resume-screener") {
    return (
      <ScreeningDashboard
        displayName={displayName}
        description={automation?.description}
        runs={runs}
        kognitosUrl={kognitosUrl}
        iframeOpen={iframeOpen}
        onOpenIframe={() => setIframeOpen(true)}
        onCloseIframe={closeIframe}
      />
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title={displayName}
        subtitle={automation?.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: displayName },
        ]}
        actions={
          kognitosUrl ? (
            <Button variant="outline" size="sm" onClick={() => setIframeOpen(true)}>
              <Icon type="ExternalLink" size="sm" />
              Open in Kognitos
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        <AutomationMetrics runs={runs} />

        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-lg border border-border bg-muted/20">
            <Icon type="Package" size="xl" className="text-muted-foreground" />
            <Text level="large" className="font-medium">No runs yet</Text>
            <Text color="muted" className="text-center max-w-md">
              This automation hasn&apos;t been run. Trigger it from the Kognitos
              platform to see data here.
            </Text>
            {kognitosUrl && (
              <Button variant="outline" size="sm" onClick={() => setIframeOpen(true)}>
                <Icon type="ExternalLink" size="sm" />
                Open in Kognitos
              </Button>
            )}
          </div>
        ) : (
          <>
            <StatusChart runs={runs} />
            <RunsTable runs={runs} />
          </>
        )}
      </div>

      {iframeOpen && kognitosUrl && (
        <KognitosIframe url={kognitosUrl} onClose={closeIframe} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Resume Screening Business Dashboard                                */
/* ------------------------------------------------------------------ */

const SCORE_COLORS: Record<string, string> = {
  High: "var(--chart-2)",
  Medium: "var(--chart-3)",
  Low: "var(--chart-1)",
};

const DECISION_COLORS: Record<string, string> = {
  Open: "var(--chart-2)",
  "Manual Review Needed": "var(--chart-3)",
  Rejected: "var(--chart-1)",
};

function ScreeningDashboard({
  displayName,
  description,
  runs,
  kognitosUrl,
  iframeOpen,
  onOpenIframe,
  onCloseIframe,
}: {
  displayName: string;
  description?: string;
  runs: RunRow[];
  kognitosUrl?: string;
  iframeOpen: boolean;
  onOpenIframe: () => void;
  onCloseIframe: () => void;
}) {
  const candidates = useMemo(
    () => runs.map(extractScreenedCandidate).filter((c): c is ScreenedCandidate => c !== null),
    [runs]
  );

  const totalScreened = candidates.length;
  const highCount = candidates.filter((c) => c.score === "High").length;
  const medCount = candidates.filter((c) => c.score === "Medium").length;
  const lowCount = candidates.filter((c) => c.score === "Low").length;
  const highPct = totalScreened > 0 ? Math.round((highCount / totalScreened) * 100) : 0;
  const acceptedCount = candidates.filter((c) => c.status === "Open").length;
  const acceptRate = totalScreened > 0 ? Math.round((acceptedCount / totalScreened) * 100) : 0;
  const failedRuns = runs.filter((r) => r.status === "failed").length;
  const awaitingRuns = runs.filter((r) => r.status === "awaiting_guidance").length;

  const scoreData = [
    { name: "High", value: highCount },
    { name: "Medium", value: medCount },
    { name: "Low", value: lowCount },
  ].filter((d) => d.value > 0);

  const decisionCounts: Record<string, number> = {};
  for (const c of candidates) {
    decisionCounts[c.status] = (decisionCounts[c.status] ?? 0) + 1;
  }
  const decisionData = Object.entries(decisionCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Screening Analytics"
        subtitle={description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Recruiting", href: "/recruiting" },
          { label: "Screening Analytics" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/apps/resume-screener">
                <Icon type="FileScan" size="sm" />
                Screen Resume
              </Link>
            </Button>
            {kognitosUrl && (
              <Button variant="outline" size="sm" onClick={onOpenIframe}>
                <Icon type="ExternalLink" size="sm" />
                Open in Kognitos
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Hero metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <InsightsCard title="Candidates Screened" value={totalScreened.toString()} />
          <InsightsCard title="High Relevance" value={`${highPct}%`} />
          <InsightsCard title="Acceptance Rate" value={`${acceptRate}%`} />
          <div className="rounded-lg border border-border bg-background p-4 space-y-1">
            <Text level="xSmall" color="muted" className="font-medium">Exceptions</Text>
            <div className="flex items-center gap-3">
              {failedRuns > 0 && <Text className="text-2xl font-bold text-destructive">{failedRuns} failed</Text>}
              {awaitingRuns > 0 && <Text className="text-2xl font-bold text-warning">{awaitingRuns} pending</Text>}
              {failedRuns === 0 && awaitingRuns === 0 && (
                <div className="flex items-center gap-2">
                  <Icon type="CircleCheck" size="sm" className="text-success" />
                  <Text className="text-lg font-bold">None</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {totalScreened === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-lg border border-border bg-muted/20">
            <Icon type="FileScan" size="xl" className="text-muted-foreground" />
            <Text level="large" className="font-medium">No candidates screened yet</Text>
            <Text color="muted" className="text-center max-w-md">
              Screen resumes to see analytics here.
            </Text>
            <Button variant="outline" size="sm" asChild>
              <Link href="/apps/resume-screener">
                <Icon type="FileScan" size="sm" />
                Go to Resume Screener
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Score distribution bar chart */}
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <Title level="h4">Relevance Score Distribution</Title>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={scoreData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 13 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="value" name="Candidates" radius={[0, 6, 6, 0]}>
                        {scoreData.map((entry) => (
                          <Cell key={entry.name} fill={SCORE_COLORS[entry.name] ?? "var(--chart-5)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Decision breakdown pie chart */}
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <Title level="h4">Routing Decisions</Title>
                </div>
                <div className="p-5 flex flex-col items-center gap-4">
                  <div className="relative">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={decisionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {decisionData.map((entry) => (
                            <Cell key={entry.name} fill={DECISION_COLORS[entry.name] ?? "var(--chart-5)"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Text className="text-2xl font-bold">{decisionData.reduce((s, d) => s + d.value, 0)}</Text>
                      <Text level="xSmall" color="muted">total</Text>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {decisionData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DECISION_COLORS[entry.name] ?? "var(--chart-5)" }} />
                          <Text level="small">{entry.name}</Text>
                        </div>
                        <Text level="small" className="font-semibold">{entry.value}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate screening history */}
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <Title level="h4">Screening History</Title>
                <Badge variant="outline" className="text-xs">{candidates.length} candidates</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Candidate</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Decision</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Opening</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Screened</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {candidates.map((c) => {
                      const scoreVariant: "success" | "destructive" | "warning" =
                        c.score === "High" ? "success" : c.score === "Low" ? "destructive" : "warning";
                      const statusVariant: "success" | "destructive" | "warning" =
                        c.status === "Open" ? "success" : c.status.includes("Reject") ? "destructive" : "warning";

                      return (
                        <tr key={c.runId} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <Text level="small" className="font-medium">{c.name}</Text>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={scoreVariant} className="text-xs">{c.score}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant} className="text-xs">{c.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Text level="xSmall" className="font-mono">{c.jobOpening}</Text>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <Text level="xSmall" color="muted" className="line-clamp-2">{c.summary || "—"}</Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text level="xSmall" color="muted">{dayjs(c.time).fromNow()}</Text>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {iframeOpen && kognitosUrl && (
        <KognitosIframe url={kognitosUrl} onClose={onCloseIframe} />
      )}
    </div>
  );
}
