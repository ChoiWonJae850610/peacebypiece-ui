import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const viewerHeaders = [
      { key: "Cache-Control", value: "private, no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'" },
    ];
    return [
      { source: "/v", headers: viewerHeaders },
      { source: "/api/public/document-viewer/:path*", headers: viewerHeaders },
    ];
  },
};

export default nextConfig;
