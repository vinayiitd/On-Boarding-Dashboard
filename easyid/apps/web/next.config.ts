import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable a leaner, self-contained production output for the Docker image.
  output: "standalone",

  reactStrictMode: true,
  poweredByHeader: false,

  // Compile shared workspace packages on the fly during `next dev` and
  // `next build`. Without this, imports like `@easyid/ui` would need to be
  // pre-built to CJS/ESM, which is unnecessary in a monorepo.
  transpilePackages: ["@easyid/sdk", "@easyid/types", "@easyid/ui"],

  eslint: {
    // We run ESLint via `pnpm lint` at the workspace root; skip it during
    // `next build` so failed lints don't block deploys mid-fix.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Same as above — typechecking runs in CI as its own task.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
