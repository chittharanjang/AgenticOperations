"use client";

import Link from "next/link";
import { Text, Icon, type IconType } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";

const APP_SECTIONS = [
  {
    group: "Recruiting",
    icon: "Users" as const,
    apps: [
      { href: "/recruiting", icon: "Users", label: "Overview", description: "Metrics, stage distribution, and navigation" },
      { href: "/recruiting/pipeline", icon: "List", label: "Pipeline", description: "Kanban board with candidates across stages" },
      { href: "/apps/resume-screener", icon: "FileScan", label: "Resume Intake", description: "Upload and screen resumes using AI" },
      { href: "/automations/resume-screener", icon: "BarChart3", label: "Analytics", description: "Screening run history and success rates" },
    ],
  },
  {
    group: "IT Operations",
    icon: "Server" as const,
    apps: [
      { href: "/ticket-ops", icon: "Tag", label: "Overview", description: "Metrics, pipeline visualization, action buttons" },
      { href: "/ticket-ops/pipeline", icon: "ChevronsRight", label: "Pipeline", description: "Cross-system ticket flow (ServiceNow to Jira)" },
      { href: "/ticket-ops/incidents", icon: "List", label: "Incidents", description: "Active ticket queue sorted by urgency" },
      { href: "/ticket-ops/analytics", icon: "BarChart3", label: "Analytics", description: "SLA compliance by category" },
    ],
  },
];

export default function AppsHomePage() {
  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Apps"
        subtitle="All application dashboards across Recruiting and IT Operations"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Apps" },
        ]}
      />

      <div className="p-6 space-y-8">
        {APP_SECTIONS.map((section) => (
          <div key={section.group} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon type={section.icon as IconType} size="sm" className="text-muted-foreground" />
              <Text className="font-semibold text-muted-foreground uppercase tracking-wider text-sm">{section.group}</Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {section.apps.map((app) => (
                <Link
                  key={app.href}
                  href={app.href}
                  className="rounded-xl border border-border bg-background p-4 space-y-2 transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-1.5">
                      <Icon type={app.icon as IconType} size="sm" className="text-primary" />
                    </div>
                    <Text className="font-semibold">{app.label}</Text>
                  </div>
                  <Text level="xSmall" color="muted">{app.description}</Text>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
