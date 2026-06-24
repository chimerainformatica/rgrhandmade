import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@opentelemetry/api"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mzxsbwoeupzctfrtaemd.supabase.co",
        pathname: "/storage/v1/object/public/vitrix-media/**"
      },
      {
        protocol: "https",
        hostname: "mzxsbwoeupzctfrtaemd.supabase.co",
        pathname: "/storage/v1/render/image/public/vitrix-media/**"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
