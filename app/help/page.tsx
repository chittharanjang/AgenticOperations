"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/app/components/PageHeader";
import { Text, Icon, Markdown } from "@kognitos/lattice";

const TOC = [
  { id: "home", label: "Home & Overview" },
  { id: "recruiting", label: "Recruiting" },
  { id: "recruiting-pipeline", label: "Recruiting Pipeline" },
  { id: "it-ops", label: "IT Overview" },
  { id: "it-pipeline", label: "IT Pipeline" },
  { id: "it-incidents", label: "IT Incidents" },
  { id: "it-analytics", label: "IT Analytics" },
  { id: "exceptions", label: "Exceptions" },
  { id: "metrics", label: "All Metrics Reference" },
];

interface MetricDef {
  name: string;
  formula: string;
  explanation: string;
}

function MetricCard({ m }: { m: MetricDef }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <Text level="small" className="font-semibold">{m.name}</Text>
      <div className="rounded bg-muted/30 px-2 py-1 my-1.5 font-mono text-xs">{m.formula}</div>
      <Text level="xSmall" color="muted">{m.explanation}</Text>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Icon type={icon as never} size="sm" className="text-primary" />
        <Text className="text-lg font-bold">{title}</Text>
      </div>
      {children}
    </section>
  );
}

export default function HelpPage() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Help & Reference"
        subtitle="Press F1 from any page for context-aware help"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Help" },
        ]}
      />

      <div className="p-6 max-w-4xl space-y-10">
        {/* Table of Contents */}
        <nav className="rounded-lg border border-border bg-muted/20 p-4">
          <Text className="font-semibold mb-2">Quick Navigation — press F1 from any page to jump to the relevant section</Text>
          <div className="flex flex-wrap gap-2">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-background border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ============================================= */}
        {/* 1. HOME & OVERVIEW */}
        {/* ============================================= */}
        <Section id="home" icon="Home" title="Home & Overview">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{`
The home page groups all AI agents into two domains: **Recruiting** (4 agents) and **IT Operations** (3 agents).

Each agent card shows its name, description, and a **Launch** button. Click the agent icon to expand and see its integrations (connected systems) and Standard Operating Procedure (step-by-step workflow).

Each group has a **Dashboard** button linking to the domain overview page.

| Domain | Agents | Dashboard |
|---|---|---|
| Recruiting | Resume Analyzer, Candidate Outreach, Interview Coordinator, Offer Builder | /recruiting |
| IT Operations | SN-Jira Sync, Incident Resolver, Bug Classifier | /ticket-ops |
`}</Markdown>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 2. RECRUITING */}
        {/* ============================================= */}
        <Section id="recruiting" icon="Users" title="Recruiting Overview">
          <div className="space-y-5">
            <div>
              <Text className="font-semibold mb-2">Metrics on this page</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard m={{ name: "Total Screened", formula: "count(all candidates)", explanation: "Total candidates in the pipeline including active and rejected." }} />
                <MetricCard m={{ name: "Acceptance Rate", formula: "(active candidates) / (total candidates) × 100", explanation: "Percentage not rejected. Active = any stage except 'rejected'." }} />
                <MetricCard m={{ name: "On Track", formula: "count(active where elapsed < warning)", explanation: "Candidates within normal processing time for their current stage." }} />
                <MetricCard m={{ name: "At Risk", formula: "count(active where warning <= elapsed < target)", explanation: "Candidates approaching their stage SLA deadline. Should be prioritized." }} />
                <MetricCard m={{ name: "SLA Breached", formula: "count(active where elapsed >= target)", explanation: "Candidates past their stage SLA target. E.g. in Screening for over 2 hours." }} />
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2">Agents</Text>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{`
| Agent | What It Does | Triggered From |
|---|---|---|
| **Resume Analyzer** | Extracts candidate data from PDF, analyzes fit, assigns relevance score | Resume Intake — Process button |
| **Candidate Outreach** | Drafts follow-up email (interview invite or rejection) | Pipeline — Advance on "Screening Passed" |
| **Interview Coordinator** | Drafts scheduling email with 3 time slot proposals | Pipeline — Advance on "Interview" |
| **Offer Builder** | Generates offer letter (future enhancement) | Not yet wired |
`}</Markdown>
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2">SLA Targets</Text>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{`
| Stage | Target | Warning | Meaning |
|---|---|---|---|
| Screening | 2 hours | 1.5 hours | Complete AI screening within 2h of resume upload |
| Screening Passed | 48 hours | 36 hours | Schedule interview within 48h of passing |
| Interview | 72 hours | 48 hours | Complete interview within 72h |
| Offer | — | — | No SLA (final stage) |
`}</Markdown>
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2">Stage Distribution</Text>
              <Text level="small" color="muted">
                The strip below the metrics shows how many candidates are in each stage: Screening → Screening Passed → Interview → Offer → Rejected. This gives an at-a-glance view of where the pipeline is heavy.
              </Text>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 3. RECRUITING PIPELINE */}
        {/* ============================================= */}
        <Section id="recruiting-pipeline" icon="List" title="Recruiting Pipeline">
          <div className="space-y-5">
            <Text level="small" color="muted">
              The pipeline is a kanban board with candidates organized by stage. Each card shows the candidate name, role, relevance score, time in stage, and SLA status. Click a card to see full details and take actions.
            </Text>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{`
### Candidate Lifecycle

| Step | Stage | What Happens | Agent | SLA |
|---|---|---|---|---|
| 1 | **Screening** | Recruiter uploads a PDF resume. Resume Analyzer extracts data, compares to job description, assigns relevance score (high/medium/low) | Resume Analyzer | 2 hours |
| 2 | **Screening Passed** | Candidates who score well. Click "Advance" to trigger Candidate Outreach — drafts interview invitation email | Candidate Outreach | 48 hours |
| 3 | **Interview** | Candidate is interviewing. Click "Advance" to trigger Interview Coordinator — proposes 3 time slots | Interview Coordinator | 72 hours |
| 4 | **Offer** | Passed interviews. Offer Builder generates the offer letter (future) | Offer Builder | — |
| — | **Rejected** | Can be rejected at any stage with a reason. Moves to Rejected column | — | — |

### Filter Bar
Use the filter pills (All / On Track / At Risk / Breached) to focus on candidates by SLA status. Counts update in real time.

### Bottleneck Alert
If one stage has a significantly higher average dwell time than others, a bottleneck warning appears showing which stage and the average time.
`}</Markdown>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 4. IT OPERATIONS OVERVIEW */}
        {/* ============================================= */}
        <Section id="it-ops" icon="Tag" title="IT Operations Overview">
          <div className="space-y-5">
            <div>
              <Text className="font-semibold mb-2">Metrics on this page</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard m={{ name: "Total Tickets", formula: "count(all tickets)", explanation: "All tickets across types and statuses, including live data from Kognitos runs and sample/demo fallback." }} />
                <MetricCard m={{ name: "SLA Compliance", formula: "(completed within SLA) / (total completed) × 100", explanation: "Percentage of finished tickets that completed within their SLA target. In-progress tickets excluded." }} />
                <MetricCard m={{ name: "Breached SLA", formula: "count(tickets where elapsed >= target)", explanation: "Both completed and in-progress tickets past their SLA target. For in-progress: elapsed = now - created_at." }} />
                <MetricCard m={{ name: "Avg Processing", formula: "sum(processingTime) / count(completed)", explanation: "Average duration from ticket creation to completion. Only completed tickets count." }} />
                <MetricCard m={{ name: "Awaiting Action", formula: "count(status = 'failed' OR 'pending')", explanation: "Tickets needing human attention — either not yet processed or failed with an error." }} />
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2">Action Buttons</Text>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{`
| Button | What It Does |
|---|---|
| **Run SN-Jira Sync** | Invokes the SN-Jira Sync agent — fetches ServiceNow incidents, auto-resolves matches, creates Jira tasks |
| **Run Ticket Triage** | Invokes the Bug Classifier agent — reads Ticket Escalation inbox, classifies bugs, creates ServiceNow tickets |
`}</Markdown>
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2">Agents</Text>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{`
| Agent | What It Does | Connections |
|---|---|---|
| **SN-Jira Sync** | Fetches SN incidents, auto-resolves on-hold matches, creates Jira tasks, resolves SN when Jira is Done | ServiceNow, HTTP (Jira) |
| **Incident Resolver** | Manages on-hold SN incidents (similar to Sync, requires manual Jira creds) | ServiceNow, HTTP |
| **Bug Classifier** | Reads Outlook inbox, classifies bugs into 6 categories using GPT-4o, creates SN tickets | Outlook, OpenAI, ServiceNow |
`}</Markdown>
              </div>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 5. IT PIPELINE */}
        {/* ============================================= */}
        <Section id="it-pipeline" icon="ChevronsRight" title="IT Ticket Pipeline">
          <div className="space-y-5">
            <Text level="small" color="muted">
              Shows the cross-system flow of tickets between ServiceNow and Jira. The pipeline visualization at the top shows ticket counts at each stage with SLA health bars (green/orange/red). Click a stage to filter the ticket table below.
            </Text>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{`
### Ticket Lifecycle

| Step | Stage | What Happens | Agent | SLA |
|---|---|---|---|---|
| 1 | **Incoming** | Bug report email arrives in Ticket Escalation inbox | — | — |
| 2 | **Triage** | Bug Classifier classifies it, extracts fields, replies to reporter, creates ServiceNow incident | Bug Classifier | 1 hour |
| 3 | **ServiceNow** | Ticket exists in SN with INC number. Awaits Jira sync. May be auto-resolved if matching a known fix | SN-Jira Sync | 30 min |
| 4 | **Jira** | SN-Jira Sync creates a Jira task in SCRUM project. Jira key linked to SN incident | SN-Jira Sync | — |
| 5 | **Resolved** | Jira task marked "Done" → resolution posted back to SN → incident closed | SN-Jira Sync | — |

### Cross-System Tracker

Below the pipeline, three cards show:
- **Linked (SN + Jira)** — tickets that exist in both systems with linked IDs
- **ServiceNow Only** — tickets awaiting Jira sync
- **SLA Issues** — tickets with breached SLA across either system

The **Cross-System Tickets** table shows each linked ticket with its ServiceNow ID, Jira key, status, and SLA side by side.
`}</Markdown>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 6. IT INCIDENTS */}
        {/* ============================================= */}
        <Section id="it-incidents" icon="AlertTriangle" title="IT Incidents">
          <div className="space-y-5">
            <div>
              <Text className="font-semibold mb-2">Metrics on this page</Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MetricCard m={{ name: "Open Tickets", formula: "count(status = 'pending')", explanation: "Tickets entered the system but not yet processed by any automation." }} />
                <MetricCard m={{ name: "Breached SLA", formula: "count(elapsed >= target)", explanation: "Tickets past their SLA target time." }} />
                <MetricCard m={{ name: "Awaiting Action", formula: "count(status = 'failed' OR 'pending')", explanation: "Tickets needing human attention." }} />
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{`
### Ticket Table

The full ticket list with filters and sortable columns:

| Column | Description |
|---|---|
| **Priority** | Critical / High / Medium / Low (color-coded badge) |
| **Title** | Ticket description + ID |
| **Type** | ServiceNow → Jira, Ticket Triage, or Incident Mgmt |
| **ServiceNow** | SN incident number (e.g. INC0041023) |
| **Jira** | Jira task key (e.g. UBER-4521) if synced |
| **Status** | Synced / Triaged / Pending / Failed / Resolved |
| **SLA** | On Track / At Risk / Breached badge with time remaining |
| **Created** | Relative timestamp |

**Filters:** Priority (All/Critical/High/Medium/Low), SLA (All/Breached/At Risk/On Track), System (All/ServiceNow Only/Jira Only/Both)

**Sort:** Click column headers for Priority, SLA, or Created to sort ascending/descending.

Default sort is by SLA status — breached tickets appear first.
`}</Markdown>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 7. IT ANALYTICS */}
        {/* ============================================= */}
        <Section id="it-analytics" icon="BarChart3" title="IT Analytics">
          <div className="space-y-5">
            <div>
              <Text className="font-semibold mb-2">Metrics on this page</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard m={{ name: "Overall Compliance", formula: "(total within SLA across all categories) / (total completed) × 100", explanation: "Aggregate SLA compliance combining all ticket types into one percentage." }} />
                <MetricCard m={{ name: "Avg Processing", formula: "sum(processingTime) / count(completed)", explanation: "Average duration from creation to completion across all completed tickets." }} />
                <MetricCard m={{ name: "Total Breached", formula: "count(all tickets where elapsed >= target)", explanation: "Total tickets past SLA across all categories." }} />
                <MetricCard m={{ name: "Tickets Completed", formula: "count(processingTime > 0)", explanation: "Total finished tickets, regardless of SLA outcome." }} />
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{`
### SLA Compliance by Category

Each category has its own compliance card showing:

| Category | SLA Target | What It Measures |
|---|---|---|
| **SN-Jira Sync** | 30 minutes | Time to sync a ServiceNow incident to Jira |
| **Ticket Triage** | 1 hour | Time to classify a bug and create a ServiceNow ticket |
| **Incident Mgmt** | 24 hours | Time to resolve an on-hold incident |

Each card shows:
- **Compliance %** — color-coded green (>=90%), orange (>=70%), red (<70%)
- **Progress bar** — visual fill representing compliance
- **Target vs Avg** — SLA target time compared to actual average processing time
- **Breakdown** — count of on track, at risk, and breached tickets
`}</Markdown>
            </div>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 8. EXCEPTIONS */}
        {/* ============================================= */}
        <Section id="exceptions" icon="AlertTriangle" title="Exceptions">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{`
When an automation encounters an error it cannot handle, the run enters "Awaiting Guidance" state. The Exceptions page shows these grouped by automation.

### What You See

Each exception card shows:
- **Error summary** — human-readable description (e.g. "email address is invalid")
- **Error type badge** — Missing Values, Invalid Values, System Error, Validation Error
- **Run ID and timestamp**
- **Expandable full error log** — raw traceback for debugging

### How to Resolve

1. **Expand** the exception card
2. **Use the Resolution Agent chat** — type instructions to guide the Kognitos agent to fix the issue
3. **If chat doesn't work**, click "Resolve in Kognitos" to open the platform directly

### Grouping

Exceptions are grouped by automation name (e.g. "Resume Analyzer — 11", "SN-Jira Sync — 10") with a count badge. This helps identify which agent is producing the most errors.
`}</Markdown>
          </div>
        </Section>

        {/* ============================================= */}
        {/* 9. ALL METRICS REFERENCE */}
        {/* ============================================= */}
        <Section id="metrics" icon="BarChart3" title="All Metric Definitions">
          <Text level="small" color="muted" className="mb-4">
            Complete reference of every metric card in the app with its exact formula.
          </Text>

          <div className="space-y-6">
            <div>
              <Text className="font-semibold mb-2 text-muted-foreground text-sm uppercase tracking-wider">Recruiting</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard m={{ name: "Total Screened", formula: "count(all candidates)", explanation: "Total candidates including active and rejected." }} />
                <MetricCard m={{ name: "Acceptance Rate", formula: "(active) / (total) × 100", explanation: "Percentage of candidates not rejected." }} />
                <MetricCard m={{ name: "On Track", formula: "count(elapsed < warning)", explanation: "Active candidates within normal processing time." }} />
                <MetricCard m={{ name: "At Risk", formula: "count(warning <= elapsed < target)", explanation: "Candidates approaching SLA deadline." }} />
                <MetricCard m={{ name: "SLA Breached", formula: "count(elapsed >= target)", explanation: "Candidates past their stage SLA target." }} />
              </div>
            </div>

            <div>
              <Text className="font-semibold mb-2 text-muted-foreground text-sm uppercase tracking-wider">IT Operations</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MetricCard m={{ name: "Total Tickets", formula: "count(all tickets)", explanation: "All tickets including live and sample data." }} />
                <MetricCard m={{ name: "SLA Compliance", formula: "(completed within SLA) / (completed) × 100", explanation: "Percentage of completed tickets within SLA." }} />
                <MetricCard m={{ name: "Breached SLA", formula: "count(elapsed >= target)", explanation: "Tickets past SLA target." }} />
                <MetricCard m={{ name: "Avg Processing", formula: "sum(time) / count(completed)", explanation: "Average processing duration." }} />
                <MetricCard m={{ name: "Awaiting Action", formula: "count(failed OR pending)", explanation: "Tickets needing human attention." }} />
                <MetricCard m={{ name: "Open Tickets", formula: "count(status = pending)", explanation: "Not yet processed by any automation." }} />
                <MetricCard m={{ name: "Overall Compliance", formula: "aggregate across all categories", explanation: "Combined SLA compliance." }} />
                <MetricCard m={{ name: "Tickets Completed", formula: "count(processingTime > 0)", explanation: "Total finished tickets." }} />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
