"use client";

import Link from "next/link";
import { Title, Text, Icon, Button, type IconType } from "@kognitos/lattice";
import { PageHeader } from "@/app/components/PageHeader";
import { AUTOMATIONS, AUTOMATION_GROUPS, getAppAutomations } from "@/lib/automations";

const SLUG_ICONS: Record<string, string> = {
  "resume-screener": "FileScan",
  "servicenow-jira": "ChevronsRight",
  "ticket-triage": "AlertTriangle",
  "servicenow-incidents": "ShieldAlert",
};

export default function HomePage() {
  const apps = getAppAutomations();

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title=".monks Operations"
        subtitle="AI-powered operations command center"
      />

      <div className="p-6 space-y-8">
        {AUTOMATION_GROUPS.map((group) => {
          const groupAutomations = AUTOMATIONS.filter((a) => a.group === group.key);
          if (groupAutomations.length === 0) return null;

          return (
            <div key={group.key} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon type={group.icon as IconType} size="sm" className="text-primary" />
                  </div>
                  <div>
                    <Title level="h3">{group.label}</Title>
                    <Text level="xSmall" color="muted">{groupAutomations.length} AI agent{groupAutomations.length !== 1 ? "s" : ""}</Text>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={group.dashboardHref}>
                    <Icon type="BarChart3" size="xs" />
                    Dashboard
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupAutomations.map((a) => {
                  const iconType = SLUG_ICONS[a.slug] ?? "Settings";
                  const isApp = apps.some((app) => app.slug === a.slug);
                  const href = isApp ? `/apps/${a.slug}` : `/automations/${a.slug}`;
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border bg-background transition-all border-border hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="p-5 flex items-start gap-4">
                        <Link
                          href={`/sops#${a.id}`}
                          className="rounded-lg p-3 transition-colors shrink-0 bg-primary/10 hover:bg-primary/20"
                          title="View SOP"
                        >
                          <Icon
                            type={iconType as IconType}
                            size="md"
                            className="text-primary"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <Text className="font-semibold">{a.name}</Text>
                              {a.description && (
                                <Text level="small" color="muted" className="line-clamp-2">
                                  {a.description}
                                </Text>
                              )}
                            </div>
                            <Button variant="outline" size="sm" asChild className="shrink-0">
                              <Link href={href}>
                                <Icon type="Play" size="sm" />
                                Launch
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

