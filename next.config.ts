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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       // Add common news source hostnames here
      // Example: Add domains for news sources you expect to use
      // You might need to adjust this list based on the actual sources
      { hostname: 'media.cnn.com' },
      { hostname: '**.reuters.com' }, // Wildcard for subdomains
      { hostname: '**.bbc.co.uk' },
      { hostname: '**.apnews.com' },
      { hostname: 'image.cnbcfm.com' },
      { hostname: '**.washingtonpost.com' },
      { hostname: '**.nytimes.com' },
      // Add more domains as needed based on News API results
    ],
  },
};

export default nextConfig;
