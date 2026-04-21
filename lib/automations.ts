export interface AutomationInput {
  key: string;
  type: "text" | "file" | "select";
  placeholder?: string;
  accept?: string;
  defaultValue?: string;
  hidden?: boolean;
  optionsEndpoint?: string;
  optionsDependsOn?: string;
}

export type AutomationGroup = "recruiting" | "it_operations";

export interface AutomationConfig {
  id: string;
  slug: string;
  name: string;
  description?: string;
  group: AutomationGroup;
  isApp?: boolean;
  inputs?: AutomationInput[];
}

export const AUTOMATION_GROUPS: { key: AutomationGroup; label: string; icon: string; dashboardHref: string }[] = [
  { key: "recruiting", label: "HR Agents", icon: "Users", dashboardHref: "/recruiting" },
  { key: "it_operations", label: "IT Agents", icon: "Server", dashboardHref: "/ticket-ops" },
];

export const AUTOMATIONS: AutomationConfig[] = [
  {
    id: "GtFXF0HQwBURCB9pB0Se4",
    slug: "resume-screener",
    name: "Resume Analyzer",
    description:
      "Extracts candidate data from resumes, analyzes fit against a job description, and routes candidates based on relevance scores.",
    group: "recruiting",
    isApp: true,
    inputs: [
      {
        key: "Job Opening ID",
        type: "select",
        placeholder: "Select a job opening",
        optionsEndpoint: "/api/job-openings",
      },
      {
        key: "ERPNext Base URL",
        type: "text",
        placeholder: "e.g. http://erptest.kognitos-test.net",
        defaultValue: "http://erptest.kognitos-test.net",
        hidden: true,
      },
      {
        key: "Resume",
        type: "file",
        accept: ".pdf",
      },
    ],
  },
  {
    id: "Bw4Hy2zzjrYIRZ72C6xCA",
    slug: "call-scheduling",
    name: "Candidate Outreach",
    description:
      "Drafts a follow-up email based on screening results — an interview invitation if accepted, or a polite rejection if not a fit.",
    group: "recruiting",
  },
  {
    id: "G4nJADaCneq0h2tLHwGlX",
    slug: "interview-scheduling",
    name: "Interview Coordinator",
    description:
      "Drafts an interview scheduling email proposing 3 available time slots for the candidate to choose from.",
    group: "recruiting",
  },
  {
    id: "T29b4qym5C3lDZhdQxjf6",
    slug: "offer-generation",
    name: "Offer Builder",
    description:
      "Generates an offer for a candidate. Placeholder automation to be enhanced with offer letter generation and email delivery.",
    group: "recruiting",
  },
  {
    id: "T39jPe8Y7cOT31dBRZCIT",
    slug: "servicenow-jira",
    name: "SN-Jira Sync",
    description:
      "Fetches ServiceNow incidents, auto-resolves on-hold tickets matching resolved issues, and creates Jira tasks for unmatched tickets.",
    group: "it_operations",
    isApp: true,
    inputs: [],
  },
  {
    id: "YtsTMqBL7UrrsJne96Fu4",
    slug: "servicenow-incidents",
    name: "Incident Resolver",
    description:
      "Manages on-hold ServiceNow incidents by auto-resolving known issues and creating Jira tasks.",
    group: "it_operations",
  },
  {
    id: "rPL3NFLwK6qglS37kckrc",
    slug: "ticket-triage",
    name: "Bug Classifier",
    description:
      "Monitors the Ticket Escalation inbox, classifies bug reports into categories, and creates ServiceNow tickets.",
    group: "it_operations",
    isApp: true,
    inputs: [],
  },
];

export function getAutomationBySlug(slug: string): AutomationConfig | undefined {
  return AUTOMATIONS.find((a) => a.slug === slug);
}

export function getAutomationById(id: string): AutomationConfig | undefined {
  return AUTOMATIONS.find((a) => a.id === id);
}

export function getAppAutomations(): AutomationConfig[] {
  return AUTOMATIONS.filter((a) => a.isApp);
}
