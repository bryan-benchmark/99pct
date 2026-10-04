import type { NextConfig } from "next";
import path from "path";
import { assertWorkspaceReleaseBuildConfig } from "./src/workspace/build-config";

assertWorkspaceReleaseBuildConfig(process.env);

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@electric-sql/pglite", "@google-cloud/cloud-sql-connector"],
  outputFileTracingIncludes: {
    "/api/workspace/health": ["./src/workspace/db/migrations/*.sql"],
    "/api/missions": ["./src/missions/db/migrations/*.sql"],
    "/api/missions/health": ["./src/missions/db/migrations/*.sql"],
    "/missions": ["./src/missions/db/migrations/*.sql"],
    "/missions/new": ["./src/missions/db/migrations/*.sql"],
    "/missions/[slug]": ["./src/missions/db/migrations/*.sql"],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [{
      source: "/workspace/:path*",
      headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
    }];
  },
  async redirects() {
    return [
      { source: "/system", destination: "/how-it-works", permanent: true },
      { source: "/protocol", destination: "/how-it-works", permanent: true },
      { source: "/compact", destination: "/principles", permanent: true },
      { source: "/constitution", destination: "/principles", permanent: true },
      { source: "/globals", destination: "/principles", permanent: true },
      {
        source: "/ownership",
        destination: "/specification",
        permanent: true,
      },
      { source: "/mcu", destination: "/specification", permanent: true },
      {
        source: "/mechanisms",
        destination: "/specification",
        permanent: true,
      },
      { source: "/operating", destination: "/specification", permanent: true },
      { source: "/meta", destination: "/specification", permanent: true },
      { source: "/lexicon", destination: "/specification", permanent: true },
      {
        source: "/mishys",
        destination: "https://mishys.com",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
