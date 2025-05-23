import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // The env block below was removed as Next.js automatically handles
  // environment variables prefixed with NEXT_PUBLIC_
  // Ensure your Firebase config variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)
  // are set in your .env.local file or hosting environment.
};

export default nextConfig;
