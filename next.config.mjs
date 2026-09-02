/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    /**
     * SHIP THE OG CARD'S FONTS.
     *
     * The share card reads two Spectral faces off disk at request time.
     * The path is built at runtime from process.cwd(), which the build's
     * file tracer cannot see, so assets/fonts never made it into the
     * deployed function: locally the repo is right there and the card
     * rendered fine, and in production readFile threw ENOENT, the route
     * 500'd, and every stand link unfurled as "Image failed to load".
     *
     * Naming the files here puts them in the bundle. Verified after a
     * build by grepping the route's .nft.json for Spectral.
     */
    outputFileTracingIncludes: {
      "/stand/[slug]/opengraph-image": ["./assets/fonts/**"],
    },
  },
  // Baseline security headers on every response. Kept to the set that can't
  // break the app: no framing (clickjacking), no MIME sniffing, tight
  // referrers, and no powerful browser APIs we don't use.
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
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
