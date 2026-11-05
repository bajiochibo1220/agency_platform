import type { NextConfig } from "next";
import path from "node:path";
const backend = process.env.BACKEND_URL || "http://127.0.0.1:8100";
const config: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; media-src 'self' https:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
