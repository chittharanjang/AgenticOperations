# IT Operations Automation SOP — Output Standardization

This document describes the current state of each Kognitos automation's outputs,
what already exists, what gaps remain, and the specific changes needed to enable the
ticket-centric dashboard with SLA tracking and cross-system correlation.

## Current State (Live API Findings)

### Ticket Escalation Bug Triage (`rPL3NFLwK6qglS37kckrc`) — 60% Complete

Already outputs a rich `processing_report` list and a `summary` dictionary.

**Existing `processing_report` fields per ticket:**
- `ticket_number` — ServiceNow INC number (e.g. `INC0010070`)
- `subject` — bug title/description
- `category` — one of: `data_not_saving`, `broken_ui`, `api_errors`, `permission_bug`, `notification_bug`, `performance_bug`
- `sender` — reporter email address
- `assigned_to` — ServiceNow assignee (e.g. `abel.tuter`)
- `action_taken` — e.g. `"ServiceNow ticket created"`
- `outcome` — e.g. `"Ticket: INC0010070 assigned to: abel.tuter"`
- `is_complete` — boolean (whether all required fields were extracted)
- `missing_fields` — list of fields reporter needs to provide
- `extracted_data` — dictionary of category-specific fields
- `email_id` — Outlook message ID

**Existing `summary` fields:**
- `total_processed`, `complete`, `incomplete`, `tickets_created`, `replies_sent`

**What's missing:**
- `priority` — no priority assignment per ticket
- `sla_target_minutes` — no SLA metadata
- Source system is implicit (always email) but not explicitly output

### ServiceNow to Jira Incident Sync (`T39jPe8Y7cOT31dBRZCIT`) — 10% Complete

Outputs **aggregate counts only** — no per-ticket detail.

**Existing outputs:**
- `incidents_fetched` — total number of ServiceNow incidents (e.g. 126)
- `on_hold_found` — count of on-hold tickets
- `auto_resolved` — count auto-resolved by keyword match
- `jira_tasks_created` — count of Jira tasks created
- `resolved_from_jira` — count resolved back from Jira

**What's missing:**
- No per-ticket list output — ticket IDs, Jira keys, short descriptions, priorities are all computed internally but never surfaced via `set_output()`
- The automation already creates Jira tasks with `[INC#] <short_description>` summaries, so the data exists in the logic — just not exposed

**Blocking issue:** 7 of 8 runs are `awaiting_guidance` due to ServiceNow 403 errors on `update_record` calls. The `servicenow-4wnrc` connection likely lacks write access.

### ServiceNow On-Hold Incident Management (`YtsTMqBL7UrrsJne96Fu4`) — 0% Complete

**Zero runs exist.** This automation requires manual `Jira Base URL` and `Jira Auth Token` inputs, suggesting it is not yet configured for automated execution.

## Required Changes

### 1. ServiceNow to Jira Incident Sync — Add `sync_report` (HIGH PRIORITY)

**Quill instruction:**

> "Add a new output called `sync_report` that is a list of dictionaries. For every on-hold ticket processed, add an entry with these fields: `servicenow_number` (the INC number), `short_description` (the ticket's short_description field), `priority` (from the incident's priority field in other_fields), `action` (either `'auto_resolved'` or `'jira_task_created'`), and `jira_key` (the Jira issue key if a task was created, or empty string if auto-resolved). This lets the dashboard show per-ticket details instead of just counts."

**Expected output after change:**
```python
set_output("sync_report", value=[
    {
        "servicenow_number": "INC0041001",
        "short_description": "VPN timeout APAC",
        "priority": "2",
        "action": "jira_task_created",
        "jira_key": "SCRUM-42"
    },
    {
        "servicenow_number": "INC0041002",
        "short_description": "Email relay backup",
        "priority": "3",
        "action": "auto_resolved",
        "jira_key": ""
    }
])
```

### 2. Ticket Triage — Add `priority` Field (MEDIUM PRIORITY)

**Quill instruction:**

> "In the processing_report output, add a new field called `priority` to each entry. Set it based on the bug category: `'critical'` for `api_errors` and `data_not_saving`, `'high'` for `permission_bug` and `notification_bug`, `'medium'` for `broken_ui` and `performance_bug`."

### 3. Fix SN-Jira Sync 403 Errors (BLOCKING)

7 out of 8 runs fail with:
```
ValueError: HTTP error occurred: Operation Failed (Status code: 403)
```
on `kognitos.sn.servicenow.update_record()` calls at two code locations (byte 4161-4543 and 10508-11006), corresponding to resolving on-hold tickets and back-resolving from Jira.

**Investigation findings:**
- The `servicenow-4wnrc` connection shows `BOOK_CONNECTION_STATE_READY` with valid credentials
- However, `COMPATIBLE_RUNTIME_VERSION` is `FALSE`, which may affect API behavior
- Read operations (`retrieve_records`) succeed — the connection can fetch incidents
- Write operations (`update_record`) consistently fail with 403

**Root causes (likely one or both):**
1. The ServiceNow service account ACLs do not grant write access to the incident table
2. The incompatible runtime version flag may cause the ServiceNow book to use a deprecated API version

**Resolution:**
- Ask the ServiceNow admin to verify the service account has `incident.write` ACL
- Check if the Kognitos ServiceNow book needs a runtime version update (contact Kognitos support about the `COMPATIBLE_RUNTIME_VERSION: FALSE` flag)

### 4. Configure Incident Management Automation (MEDIUM)

This automation has never been executed. It requires:
- `Jira Base URL` — e.g. `https://your-domain.atlassian.net`
- `Jira Auth Token` — Base64-encoded `email:api_token`

Either provide these as default inputs or refactor the automation to use the `http` connection (like SN-Jira Sync does) so it doesn't require manual credentials.

### 5. Add SLA Fields to Both Automations (LOW PRIORITY)

Once the above changes are live, add SLA metadata:

> "Add two new outputs: `sla_target_minutes` (set to 30 for SN-Jira Sync, 60 for Ticket Triage) and `processing_start_time` (the ISO timestamp when the run started). This enables the dashboard to compute SLA compliance from live data."

## New Automation: Ticket Status Poller (Recommended)

None of the existing automations provide ongoing cross-system status polling — they only capture point-in-time processing events. A lightweight scheduled automation is needed.

**Purpose:** Power real-time cross-system monitoring without depending solely on
the sync automation's run history.

**Behavior:**
1. Query ServiceNow for all open incidents (filter by category or assignment group).
2. For each incident with a linked Jira key, query Jira for current status.
3. Output a table with columns: `servicenow_id`, `jira_key`, `sn_status`, `jira_status`,
   `priority`, `title`, `last_updated`, `sla_status`.

**Connections required:** `sn` (ServiceNow), `http` (for Jira REST API).

**Schedule:** Every 5 minutes during business hours, every 15 minutes off-hours.

## SLA Targets Reference

| Automation | SLA Target | Warning Threshold |
|---|---|---|
| ServiceNow → Jira Sync | 30 minutes | 20 minutes |
| Ticket Triage | 1 hour | 45 minutes |
| Incident Management | 24 hours | 18 hours |
| Exception Resolution | 4 hours | 3 hours |

## Migration Path

1. **Phase 1 (now):** Dashboard uses sample data with SLA computations. Live run
   outputs from Ticket Triage's `processing_report` are also parsed and merged.
2. **Phase 2:** Send Quill instructions to add `sync_report` to SN-Jira Sync and
   `priority` to Ticket Triage. Fix the 403 permission issue. Dashboard parses both
   live outputs alongside sample data fallback.
3. **Phase 3:** Build the Ticket Status Poller automation. Dashboard switches to
   live polling data for cross-system status.
4. **Phase 4:** Remove sample data fallback; dashboard fully driven by live automation data.
