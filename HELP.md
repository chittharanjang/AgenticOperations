# Uber Shared Services — Application Help Guide

## Overview

This application is an AI-powered operations command center that monitors and manages
two business domains: **Recruiting** and **IT Operations**. Each domain has a set of
AI agents (Kognitos automations) that perform tasks, and a set of dashboard pages
that provide visibility into their work.

---

## Application Structure

### Home (`/`)
The landing page groups all AI agents by domain (Recruiting and IT Operations).
Each agent card shows its name, description, and a Launch button. Click the agent
icon to expand and see its integrations and standard operating procedure (SOP) steps.
Each group has a Dashboard button linking to the domain overview.

### Recruiting

| Page | Path | Purpose |
|---|---|---|
| Overview | `/recruiting` | Metrics, stage distribution, nav cards |
| Pipeline | `/recruiting/pipeline` | Kanban board of candidates across stages |
| Resume Intake | `/apps/resume-screener` | Upload a resume and run AI screening |
| Analytics | `/automations/resume-screener` | Screening run history and success rates |

### IT Operations

| Page | Path | Purpose |
|---|---|---|
| Overview | `/ticket-ops` | Metrics, pipeline visualization, action buttons |
| Pipeline | `/ticket-ops/pipeline` | Cross-system ticket flow (ServiceNow to Jira) |
| Incidents | `/ticket-ops/incidents` | Active ticket queue sorted by urgency |
| Analytics | `/ticket-ops/analytics` | SLA compliance by category |

### Cross-Cutting

| Page | Path | Purpose |
|---|---|---|
| Exceptions | `/exceptions` | Automation errors grouped by agent, with Resolution Agent chat |
| Chat | `/chat` | Claude AI assistant for questions about the platform |

---

## AI Agents (Kognitos Automations)

### Recruiting Agents

#### 1. Resume Analyzer
- **What it does:** Extracts candidate data from a PDF resume, analyzes fit against a
  job description using AI, and assigns a relevance score (high/medium/low).
- **Triggered from:** Resume Intake page (`/apps/resume-screener`)
- **Inputs:** Job Opening ID (selected from list), Resume (PDF upload)
- **Outputs:** Candidate name, email, role, relevance score, screening summary
- **Integrations:** AI Document Processing (IDP), ERPNext
- **Pipeline stage:** Moves candidate into "Screening" stage

#### 2. Candidate Outreach
- **What it does:** Drafts a follow-up email based on screening results. If the
  candidate passed, it drafts an interview invitation. If not, a polite rejection.
- **Triggered from:** Pipeline page — "Advance" button on candidates in "Screening Passed" stage
- **Inputs:** Candidate name, email, status, role, job opening ID, screening summary
- **Outputs:** Draft email content
- **Pipeline stage:** Advances candidate from "Screening Passed" to "Interview"

#### 3. Interview Coordinator
- **What it does:** Drafts an interview scheduling email proposing 3 available time
  slots for the candidate to choose from.
- **Triggered from:** Pipeline page — "Advance" button on candidates in "Interview" stage
- **Inputs:** Candidate name, email, role, job opening ID
- **Outputs:** Draft scheduling email
- **Pipeline stage:** Advances candidate from "Interview" to "Offer"

#### 4. Offer Builder
- **What it does:** Generates an offer for a candidate. Currently a placeholder
  automation to be enhanced with offer letter generation and email delivery.
- **Triggered from:** Not yet wired to UI (future enhancement)
- **Pipeline stage:** Final stage

### IT Operations Agents

#### 5. SN-Jira Sync
- **What it does:** Fetches all ServiceNow incidents, splits them into on-hold and
  resolved groups, auto-resolves on-hold tickets that match known resolved issues by
  keyword overlap, creates Jira tasks in the SCRUM project for unmatched tickets,
  and resolves ServiceNow tickets when their Jira task is marked Done.
- **Triggered from:** IT Overview and Pipeline pages — "Run SN-Jira Sync" button
- **Inputs:** None (automated)
- **Outputs:** `sync_report` (per-ticket details), plus counts: incidents_fetched,
  on_hold_found, auto_resolved, jira_tasks_created, resolved_from_jira
- **Integrations:** ServiceNow (`servicenow-4wnrc`), HTTP/REST for Jira (`http-n9czg`)
- **Known issue:** ServiceNow 403 error on `update_record` — the service account
  lacks write permissions to the incident table

#### 6. Incident Resolver
- **What it does:** Manages on-hold ServiceNow incidents by auto-resolving known
  issues and creating Jira tasks for unresolved ones. Similar to SN-Jira Sync but
  requires manual Jira credentials.
- **Triggered from:** Not currently triggered from UI (requires Jira Base URL and
  Auth Token as manual inputs)
- **Status:** Dormant — zero runs to date

#### 7. Bug Classifier
- **What it does:** Monitors the "Ticket Escalation" email inbox via Outlook,
  retrieves unread bug reports, uses GPT-4o to classify each into one of 6
  categories (data_not_saving, broken_ui, api_errors, permission_bug,
  notification_bug, performance_bug), extracts required fields per category,
  sends reply emails to reporters, and creates ServiceNow incidents routed to
  the appropriate engineering lead.
- **Triggered from:** IT Overview and Pipeline pages — "Run Ticket Triage" button
- **Inputs:** None (automated — reads from Outlook inbox)
- **Outputs:** `processing_report` (per-ticket: ticket_number, subject, category,
  priority, assigned_to, action_taken, outcome), `summary` (total_processed,
  complete, incomplete, tickets_created, replies_sent)
- **Integrations:** Microsoft Outlook (`outlook-j7phk`), OpenAI GPT-4o (`openai-5cq2n`),
  ServiceNow (`servicenow-4wnrc`)

---

## SLA Definitions and Logic

The application tracks SLA (Service Level Agreement) compliance across both domains.
Each item (candidate or ticket) is assigned one of three SLA statuses based on how
long it has been in its current stage:

| Status | Meaning | Visual |
|---|---|---|
| **On Track** | Within the normal processing window | Green indicator |
| **At Risk** | Approaching the SLA deadline (past warning threshold) | Orange/yellow indicator |
| **Breached** | Past the SLA target — requires immediate attention | Red indicator |

### How SLA Status Is Calculated

```
if elapsed_time >= target    → BREACHED
if elapsed_time >= warning   → AT RISK
otherwise                    → ON TRACK
```

For completed items, `elapsed_time` is the actual processing duration.
For in-progress items, `elapsed_time` is calculated as `now - created_at`.

### Recruiting Pipeline SLAs

| Stage | Target | Warning | What It Means |
|---|---|---|---|
| Screening | 2 hours | 1.5 hours | Complete the AI resume screening within 2 hours of submission |
| Screening Passed | 48 hours | 36 hours | Schedule an interview within 48 hours of passing screening |
| Interview | 72 hours | 48 hours | Complete the interview process within 72 hours |
| Offer | — | — | No SLA defined (final stage) |

### IT Operations Ticket SLAs

| Ticket Type | Target | Warning | What It Means |
|---|---|---|---|
| SN-Jira Sync | 30 minutes | 20 minutes | Sync a ServiceNow incident to Jira within 30 minutes |
| Ticket Triage | 1 hour | 45 minutes | Classify and create a ServiceNow ticket within 1 hour |
| Incident Management | 24 hours | 18 hours | Resolve an on-hold incident within 24 hours |
| Exception Resolution | 4 hours | 3 hours | Resolve an automation exception within 4 hours |

### SLA Compliance Percentage

Compliance is calculated as:

```
compliance = (tickets completed within SLA target) / (total completed tickets) × 100
```

Only completed items count toward compliance. In-progress items are tracked for
breach/at-risk status but do not affect the compliance percentage until they finish.

### Where SLA Appears in the App

- **Recruiting Overview:** On Track / At Risk / SLA Breached metric cards
- **Recruiting Pipeline:** Color-coded candidate cards + SLA badge on each card
- **IT Overview:** SLA Compliance % metric card
- **IT Incidents:** Breached SLA count + SLA column in ticket table
- **IT Pipeline:** SLA health bars on each pipeline stage
- **IT Analytics:** Per-category SLA compliance with progress bars, target vs actual

---

## Exceptions and Resolution

When a Kognitos automation encounters an error it cannot handle automatically, the
run enters an "Awaiting Guidance" state. These appear on the Exceptions page
(`/exceptions`), grouped by automation.

Each exception shows:
- **Error description** — human-readable summary of what went wrong
- **Error type** — Missing Values, Invalid Values, System Error, Validation Error
- **Run ID and timestamp**
- **Full error log** — expandable raw traceback

For pending exceptions, a **Resolution Agent** chat interface is available. You can
type instructions to guide the Kognitos Resolution Agent (Astral) to fix the issue.
If the chat-based resolution fails, a "Resolve in Kognitos" button opens the
Kognitos platform directly.

---

## Data Sources

The application uses two data sources:

1. **Live data** — Parsed from actual Kognitos automation run outputs. The app fetches
   completed runs from the Kognitos API and extracts ticket/candidate data from the
   structured outputs (`processing_report`, `sync_report`, etc.).

2. **Sample data** — Pre-defined demo tickets and candidates used as a fallback when
   live data is insufficient. Sample data is clearly marked in the UI.

The data source indicator at the bottom of IT Operations pages shows the breakdown
(e.g., "12 live tickets from Kognitos runs + 20 sample tickets (demo fallback)").

---

## Automation Trigger Map

This table shows every place in the app where a Kognitos automation can be invoked:

| UI Location | Button Label | Automation Triggered | Kognitos ID |
|---|---|---|---|
| Resume Intake page | Process | Resume Analyzer | `GtFXF0HQwBURCB9pB0Se4` |
| Pipeline — Screening Passed stage | Advance | Candidate Outreach | `Bw4Hy2zzjrYIRZ72C6xCA` |
| Pipeline — Interview stage | Advance | Interview Coordinator | `G4nJADaCneq0h2tLHwGlX` |
| IT Overview header | Run SN-Jira Sync | SN-Jira Sync | `T39jPe8Y7cOT31dBRZCIT` |
| IT Overview header | Run Ticket Triage | Bug Classifier | `rPL3NFLwK6qglS37kckrc` |
| IT Pipeline header | Run SN-Jira Sync | SN-Jira Sync | `T39jPe8Y7cOT31dBRZCIT` |
| IT Pipeline header | Run Ticket Triage | Bug Classifier | `rPL3NFLwK6qglS37kckrc` |
| Exceptions page | Send (chat) | Resolution Agent | (per-run) |

---

## Ticket Pipeline Flow

Tickets flow through the IT Operations pipeline in this sequence:

```
Email Inbox → Bug Classifier → ServiceNow → SN-Jira Sync → Jira → Resolved
```

1. **Incoming:** Bug reports arrive via email to the Ticket Escalation inbox
2. **Triage:** Bug Classifier reads emails, classifies them, creates ServiceNow tickets
3. **ServiceNow:** Tickets exist in ServiceNow, awaiting Jira sync
4. **Jira:** SN-Jira Sync creates Jira tasks for unresolved on-hold tickets
5. **Resolved:** Tickets resolved either by auto-match or when Jira task is marked Done

---

## Recruiting Pipeline Flow

Candidates flow through the recruiting pipeline in this sequence:

```
Resume Upload → Screening → Screening Passed → Interview → Offer
                    ↓
                 Rejected
```

1. **Screening:** Resume Analyzer processes the uploaded PDF
2. **Screening Passed:** Candidate Outreach sends interview invitation or rejection
3. **Interview:** Interview Coordinator proposes time slots
4. **Offer:** Offer Builder generates the offer (future enhancement)
5. **Rejected:** Candidates can be rejected at any stage with a reason
