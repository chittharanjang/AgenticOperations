"use client";

import { useEffect } from "react";
import { Button, Icon, Text } from "@kognitos/lattice";

interface KognitosIframeProps {
  url: string;
  onClose: () => void;
}

export function KognitosIframe({ url, onClose }: KognitosIframeProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);

    const sidebar = document.querySelector("[data-sidebar]") as HTMLElement | null;
    if (sidebar) sidebar.style.display = "none";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      if (sidebar) sidebar.style.display = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <Icon type="ExternalLink" size="sm" className="text-primary" />
          <Text level="small" className="font-medium truncate max-w-md">{url}</Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Icon type="Maximize2" size="sm" />
              Open in New Tab
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            <Icon type="X" size="sm" />
            Close
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        allow="clipboard-write"
        title="Kognitos Platform"
      />
    </div>
  );
}
