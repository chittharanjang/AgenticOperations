"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import "./globals.css";
import { ThemeProvider, SidebarProvider, SidebarInset } from "@kognitos/lattice";
import { ChatProvider } from "@/lib/chat/chat-context";
import { AppSidebar } from "@/app/components/AppSidebar";

const HELP_ANCHORS: Record<string, string> = {
  "/": "home",
  "/recruiting": "recruiting",
  "/recruiting/pipeline": "recruiting-pipeline",
  "/apps/resume-screener": "recruiting",
  "/automations/resume-screener": "recruiting",
  "/ticket-ops": "it-ops",
  "/ticket-ops/pipeline": "it-pipeline",
  "/ticket-ops/incidents": "it-incidents",
  "/ticket-ops/analytics": "it-analytics",
  "/exceptions": "exceptions",
  "/chat": "home",
  "/help": "metrics",
};

function F1HotkeyListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F1") {
        e.preventDefault();
        const anchor = HELP_ANCHORS[pathname] ?? "home";
        if (pathname === "/help") {
          document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
        } else {
          router.push(`/help#${anchor}`);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname]);

  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="light">
          <ChatProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset>
                <F1HotkeyListener />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
