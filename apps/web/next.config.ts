import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @spaceflow/database is bundled by tsup into a single dist/index.js, and Prisma
  // loads its native query engine via a runtime path.join(__dirname, "...") string
  // that Next.js's file tracer can't follow statically. Without help, the
  // rhel-openssl-3.0.x engine binary never gets copied into the Vercel serverless
  // function, so every DB query fails with "could not locate the Query Engine".
  // Point tracing at the monorepo root and force-include both engine binaries.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/**": [
      "../../packages/database/dist/*.so.node",
      "../../packages/database/generated/prisma/*.so.node",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://api.dicebear.com; font-src 'self' data:; connect-src 'self' https://api.openai.com https://raw.githubusercontent.com https://cdn.jsdelivr.net ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
