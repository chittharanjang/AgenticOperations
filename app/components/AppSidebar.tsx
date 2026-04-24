"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  ModeToggle,
  Badge,
  Text,
  Icon,
  type IconType,
} from "@kognitos/lattice";
import { AUTOMATIONS, getAppAutomations } from "@/lib/automations";
import { useChatContext } from "@/lib/chat/chat-context";

const ICON_MAP: Record<string, string> = {
  "servicenow-jira": "ChevronsRight",
  "servicenow-incidents": "ShieldAlert",
  "ticket-triage": "AlertTriangle",
  "resume-screener": "FileScan",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { setActiveSessionId } = useChatContext();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/exceptions")
      .then((r) => r.json())
      .then((data) => {
        const pending = (data.exceptions ?? []).filter(
          (e: { state: string }) => e.state === "EXCEPTION_STATE_PENDING"
        );
        setPendingCount(pending.length);
      })
      .catch(() => {});
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="block">
          <Image
            src="/logo.png"
            alt=".monks"
            width={100}
            height={32}
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Agents */}
        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"}>
                <Link href="/">
                  <Icon type="Home" size="sm" />
                  <span>All Agents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Apps */}
        <SidebarGroup>
          <SidebarGroupLabel>Apps</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/apps-home"}>
                <Link href="/apps-home">
                  <Icon type="Blocks" size="sm" />
                  <span>All Apps</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* SOPs */}
        <SidebarGroup>
          <SidebarGroupLabel>SOPs</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/sops"}>
                <Link href="/sops">
                  <Icon type="ListOrdered" size="sm" />
                  <span>All SOPs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/exceptions"}>
                <Link href="/exceptions">
                  <Icon type="AlertTriangle" size="sm" />
                  <span className="flex-1">Exceptions</span>
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/help"}>
                <Link href="/help">
                  <Icon type="HelpCircle" size="sm" />
                  <span>Help & Reference</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/chat"}
                onClick={() => setActiveSessionId(null)}
              >
                <Link href="/chat">
                  <Icon type="MessageSquare" size="sm" />
                  <span>Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center justify-between">
          <Text level="xSmall" className="text-lime-400">Powered by Kognitos</Text>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
