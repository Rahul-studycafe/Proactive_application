/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevent formatting and linting warnings from breaking production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Maintain strict TypeScript type checks during builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
