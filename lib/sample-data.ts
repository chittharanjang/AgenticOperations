export type PipelineStage =
  | "screening"
  | "screening_passed"
  | "interview"
  | "offer"
  | "rejected";

export const STAGE_ORDER: PipelineStage[] = [
  "screening",
  "screening_passed",
  "interview",
  "offer",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  screening: "Screening",
  screening_passed: "Screening Passed",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export type CandidateRunStatus =
  | "completed"
  | "executing"
  | "pending"
  | "failed"
  | "awaiting_guidance";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  stage: PipelineStage;
  relevanceScore: "high" | "medium" | "low";
  stageEnteredAt: string;
  resumeReceivedAt: string;
  screeningCompletedAt?: string;
  interviewNotes?: string;
  rejectionReason?: string;
  jobOpeningId: string;
  runStatus?: CandidateRunStatus;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function daysAgo(d: number): string {
  return hoursAgo(d * 24);
}

export const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "C-001",
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    role: "Senior Software Engineer",
    stage: "offer",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(6),
    resumeReceivedAt: daysAgo(12),
    screeningCompletedAt: daysAgo(11),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-002",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    role: "Data Engineer",
    stage: "interview",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(18),
    resumeReceivedAt: daysAgo(10),
    screeningCompletedAt: daysAgo(9),
    jobOpeningId: "HR-OPN-2026-0003",
  },
  {
    id: "C-003",
    name: "Aisha Patel",
    email: "aisha.patel@email.com",
    role: "Product Manager",
    stage: "interview",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(40),
    resumeReceivedAt: daysAgo(9),
    screeningCompletedAt: daysAgo(8),
    jobOpeningId: "HR-OPN-2026-0001",
  },
  {
    id: "C-004",
    name: "David Chen",
    email: "dchen@email.com",
    role: "Backend Engineer",
    stage: "interview",
    relevanceScore: "medium",
    stageEnteredAt: hoursAgo(60),
    resumeReceivedAt: daysAgo(8),
    screeningCompletedAt: daysAgo(7),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-005",
    name: "Sofia Rodriguez",
    email: "sofia.r@email.com",
    role: "UX Designer",
    stage: "interview",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(20),
    resumeReceivedAt: daysAgo(6),
    screeningCompletedAt: daysAgo(5),
    jobOpeningId: "HR-OPN-2026-0004",
  },
  {
    id: "C-006",
    name: "James Wilson",
    email: "jwilson@email.com",
    role: "DevOps Engineer",
    stage: "screening_passed",
    relevanceScore: "medium",
    stageEnteredAt: hoursAgo(10),
    resumeReceivedAt: daysAgo(5),
    screeningCompletedAt: daysAgo(4),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-007",
    name: "Emma Thompson",
    email: "emma.t@email.com",
    role: "Frontend Engineer",
    stage: "screening_passed",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(14),
    resumeReceivedAt: daysAgo(4),
    screeningCompletedAt: daysAgo(3),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-008",
    name: "Raj Krishnamurthy",
    email: "raj.k@email.com",
    role: "ML Engineer",
    stage: "screening_passed",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(22),
    resumeReceivedAt: daysAgo(3),
    screeningCompletedAt: daysAgo(2),
    jobOpeningId: "HR-OPN-2026-0003",
  },
  {
    id: "C-009",
    name: "Lisa Park",
    email: "lisa.park@email.com",
    role: "QA Lead",
    stage: "screening_passed",
    relevanceScore: "medium",
    stageEnteredAt: hoursAgo(3),
    resumeReceivedAt: daysAgo(2),
    screeningCompletedAt: hoursAgo(3),
    jobOpeningId: "HR-OPN-2026-0005",
  },
  {
    id: "C-010",
    name: "Alex Novak",
    email: "alex.novak@email.com",
    role: "Security Engineer",
    stage: "screening",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(1),
    resumeReceivedAt: hoursAgo(2),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-011",
    name: "Wei Zhang",
    email: "wei.z@email.com",
    role: "Platform Engineer",
    stage: "screening",
    relevanceScore: "medium",
    stageEnteredAt: hoursAgo(1.5),
    resumeReceivedAt: hoursAgo(3),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-012",
    name: "Hannah Mitchell",
    email: "hmitchell@email.com",
    role: "Technical Writer",
    stage: "screening",
    relevanceScore: "medium",
    stageEnteredAt: hoursAgo(0.5),
    resumeReceivedAt: hoursAgo(0.5),
    jobOpeningId: "HR-OPN-2026-0006",
  },
  {
    id: "C-013",
    name: "Carlos Mendez",
    email: "carlos.m@email.com",
    role: "Senior Backend Engineer",
    stage: "screening",
    relevanceScore: "high",
    stageEnteredAt: hoursAgo(1),
    resumeReceivedAt: hoursAgo(1),
    jobOpeningId: "HR-OPN-2026-0002",
  },
  {
    id: "C-014",
    name: "Nina Kowalski",
    email: "N/A",
    role: "Data Analyst",
    stage: "rejected",
    relevanceScore: "low",
    stageEnteredAt: hoursAgo(5),
    resumeReceivedAt: daysAgo(1),
    screeningCompletedAt: hoursAgo(5),
    rejectionReason: "Invalid email address — could not create applicant record.",
    jobOpeningId: "HR-OPN-2026-0003",
  },
  {
    id: "C-015",
    name: "Tom Bradley",
    email: "tbradley@email.com",
    role: "iOS Engineer",
    stage: "rejected",
    relevanceScore: "low",
    stageEnteredAt: daysAgo(3),
    resumeReceivedAt: daysAgo(4),
    screeningCompletedAt: daysAgo(3),
    rejectionReason: "Relevance score too low for the role requirements.",
    jobOpeningId: "HR-OPN-2026-0002",
  },
];

export type TicketType = "servicenow_jira_sync" | "ticket_triage" | "incident_management";

export interface TicketOpsRecord {
  id: string;
  type: TicketType;
  title: string;
  source: string;
  status: "synced" | "triaged" | "pending" | "failed" | "resolved";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string;
  completedAt?: string;
  processingTimeMs: number;
  slaTargetMs: number;
  jiraKey?: string;
  serviceNowId?: string;
}

const THIRTY_MIN = 30 * 60_000;
const ONE_HOUR = 60 * 60_000;

export const SAMPLE_TICKETS: TicketOpsRecord[] = [
  { id: "TK-001", type: "servicenow_jira_sync", title: "Login SSO failure — multiple users affected", source: "ServiceNow", status: "synced", priority: "critical", createdAt: hoursAgo(0.5), completedAt: hoursAgo(0.3), processingTimeMs: 12 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4521", serviceNowId: "INC0041023" },
  { id: "TK-002", type: "servicenow_jira_sync", title: "VPN connectivity timeout for APAC region", source: "ServiceNow", status: "synced", priority: "high", createdAt: hoursAgo(1), completedAt: hoursAgo(0.8), processingTimeMs: 8 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4520", serviceNowId: "INC0041022" },
  { id: "TK-003", type: "servicenow_jira_sync", title: "Email relay queue backup", source: "ServiceNow", status: "synced", priority: "medium", createdAt: hoursAgo(2), completedAt: hoursAgo(1.7), processingTimeMs: 18 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4519", serviceNowId: "INC0041021" },
  { id: "TK-004", type: "servicenow_jira_sync", title: "Printer fleet offline — Building 3", source: "ServiceNow", status: "synced", priority: "low", createdAt: hoursAgo(3), completedAt: hoursAgo(2.5), processingTimeMs: 25 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4518", serviceNowId: "INC0041020" },
  { id: "TK-005", type: "servicenow_jira_sync", title: "Database replication lag on prod-east", source: "ServiceNow", status: "pending", priority: "critical", createdAt: hoursAgo(0.2), processingTimeMs: 0, slaTargetMs: THIRTY_MIN, serviceNowId: "INC0041024" },
  { id: "TK-006", type: "servicenow_jira_sync", title: "SSL certificate expiry warning — api.uber.internal", source: "ServiceNow", status: "failed", priority: "high", createdAt: hoursAgo(4), processingTimeMs: 35 * 60_000, slaTargetMs: THIRTY_MIN, serviceNowId: "INC0041019" },
  { id: "TK-007", type: "ticket_triage", title: "Bug: Payment processing returns 500 intermittently", source: "Email", status: "triaged", priority: "critical", createdAt: hoursAgo(1), completedAt: hoursAgo(0.5), processingTimeMs: 28 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041025" },
  { id: "TK-008", type: "ticket_triage", title: "Bug: Map pins not rendering on Android 15", source: "Email", status: "triaged", priority: "high", createdAt: hoursAgo(2), completedAt: hoursAgo(1.2), processingTimeMs: 45 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041026" },
  { id: "TK-009", type: "ticket_triage", title: "Bug: Driver earnings report shows wrong currency", source: "Email", status: "triaged", priority: "medium", createdAt: hoursAgo(3), completedAt: hoursAgo(2.3), processingTimeMs: 38 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041027" },
  { id: "TK-010", type: "ticket_triage", title: "Bug: Push notifications delayed by 10+ minutes", source: "Email", status: "pending", priority: "high", createdAt: hoursAgo(0.3), processingTimeMs: 0, slaTargetMs: ONE_HOUR },
  { id: "TK-011", type: "ticket_triage", title: "Bug: Promo code UBER50 not applying correctly", source: "Email", status: "triaged", priority: "low", createdAt: hoursAgo(5), completedAt: hoursAgo(4), processingTimeMs: 55 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041028" },
  { id: "TK-012", type: "ticket_triage", title: "Bug: Accessibility — screen reader skips fare estimate", source: "Email", status: "failed", priority: "medium", createdAt: hoursAgo(6), processingTimeMs: 70 * 60_000, slaTargetMs: ONE_HOUR },
  { id: "TK-013", type: "incident_management", title: "On-hold: Waiting for vendor patch — Okta integration", source: "ServiceNow", status: "resolved", priority: "high", createdAt: daysAgo(2), completedAt: daysAgo(1), processingTimeMs: 22 * 3600_000, slaTargetMs: 24 * 3600_000, serviceNowId: "INC0040998" },
  { id: "TK-014", type: "incident_management", title: "On-hold: AWS support case — EBS volume degraded", source: "ServiceNow", status: "resolved", priority: "critical", createdAt: daysAgo(3), completedAt: daysAgo(2), processingTimeMs: 18 * 3600_000, slaTargetMs: 24 * 3600_000, serviceNowId: "INC0040985" },
  { id: "TK-015", type: "incident_management", title: "On-hold: License renewal — Splunk Enterprise", source: "ServiceNow", status: "pending", priority: "medium", createdAt: hoursAgo(8), processingTimeMs: 0, slaTargetMs: 24 * 3600_000, serviceNowId: "INC0041010" },
  { id: "TK-016", type: "servicenow_jira_sync", title: "MFA enrollment failure for new hires batch", source: "ServiceNow", status: "synced", priority: "high", createdAt: hoursAgo(6), completedAt: hoursAgo(5.6), processingTimeMs: 22 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4517", serviceNowId: "INC0041015" },
  { id: "TK-017", type: "servicenow_jira_sync", title: "CI/CD pipeline stuck — deploy queue full", source: "ServiceNow", status: "synced", priority: "critical", createdAt: hoursAgo(8), completedAt: hoursAgo(7.5), processingTimeMs: 15 * 60_000, slaTargetMs: THIRTY_MIN, jiraKey: "UBER-4516", serviceNowId: "INC0041012" },
  { id: "TK-018", type: "ticket_triage", title: "Bug: Surge pricing UI shows stale data", source: "Email", status: "triaged", priority: "high", createdAt: hoursAgo(8), completedAt: hoursAgo(7), processingTimeMs: 52 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041029" },
  { id: "TK-019", type: "ticket_triage", title: "Bug: Rider safety alert not triggering on route deviation", source: "Email", status: "triaged", priority: "critical", createdAt: hoursAgo(10), completedAt: hoursAgo(9.2), processingTimeMs: 42 * 60_000, slaTargetMs: ONE_HOUR, serviceNowId: "INC0041030" },
  { id: "TK-020", type: "incident_management", title: "On-hold: Datacenter cooling alert — us-east-2", source: "ServiceNow", status: "pending", priority: "critical", createdAt: hoursAgo(3), processingTimeMs: 0, slaTargetMs: 24 * 3600_000, serviceNowId: "INC0041011" },
];

export interface SampleException {
  id: string;
  runId: string;
  automationName: string;
  message: string;
  description: string;
  group: string;
  state: "pending" | "resolved";
  createdAt: string;
}

export const SAMPLE_EXCEPTIONS: SampleException[] = [
  {
    id: "EX-001",
    runId: "WnwV2GSw5ktLXoj8rmjot",
    automationName: "Resume Screener & Applicant Router",
    message: "N/A is not a valid Email Address",
    description: "Could not create the job applicant record because the email address is invalid.",
    group: "invalid_values",
    state: "pending",
    createdAt: hoursAgo(0.5),
  },
  {
    id: "EX-002",
    runId: "Xk9mP2qR7tN4wYjB3cL6v",
    automationName: "ServiceNow to Jira Incident Sync",
    message: "Jira API rate limit exceeded (429)",
    description: "Could not create Jira task — API rate limit reached. Will retry automatically.",
    group: "user_system_error",
    state: "pending",
    createdAt: hoursAgo(2),
  },
  {
    id: "EX-003",
    runId: "Lm5nQ8sT2xW7yHj4kP9a",
    automationName: "Ticket Escalation Bug Triage",
    message: "Unable to classify email — no subject line found",
    description: "The incoming email had an empty subject line and could not be categorized.",
    group: "missing_values",
    state: "pending",
    createdAt: hoursAgo(4),
  },
  {
    id: "EX-004",
    runId: "Rp3vK6bN8mC1xFj5tQ7w",
    automationName: "Resume Screener & Applicant Router",
    message: "PDF parsing failed — encrypted document",
    description: "The uploaded resume is password-protected and cannot be read.",
    group: "validation_error",
    state: "resolved",
    createdAt: daysAgo(1),
  },
];

export type TicketTypeMeta = { label: string; color: string };

export const TICKET_TYPE_LABELS: Record<TicketType, TicketTypeMeta> = {
  servicenow_jira_sync: { label: "ServiceNow → Jira", color: "var(--chart-1)" },
  ticket_triage: { label: "Ticket Triage", color: "var(--chart-2)" },
  incident_management: { label: "Incident Mgmt", color: "var(--chart-4)" },
};
