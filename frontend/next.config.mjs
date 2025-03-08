/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      '192.168.1.243',
      
      'cigar-palate-images.nyc3.cdn.digitaloceanspaces.com',
      
      'cigar-palate-images.nyc3.digitaloceanspaces.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`
      }
    ];
  }
};

export default nextConfig;