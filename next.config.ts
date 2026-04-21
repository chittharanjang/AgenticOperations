import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["apache-arrow"],
  async redirects() {
    return [
      {
        source: "/apps/servicenow-jira",
        destination: "/ticket-ops",
        permanent: false,
      },
      {
        source: "/apps/ticket-triage",
        destination: "/ticket-ops",
        permanent: false,
      },
      {
        source: "/automations/servicenow-incidents",
        destination: "/ticket-ops",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
