
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['primereact'],
  devIndicators: false,

  // Silence workspace root warning in server monorepo layout
  outputFileTracingRoot: '/var/www/swcs2.0',

  // We keep Apache as the reverse proxy for /api → Nest (no Next rewrites needed)
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
