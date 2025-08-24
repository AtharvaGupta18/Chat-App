
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
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
  allowedDevOrigins: [
    '*.cluster-bqwaigqtxbeautecnatk4o6ynk.cloudworkstations.dev',
  ],
};

export default nextConfig;
