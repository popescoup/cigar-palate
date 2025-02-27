/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['192.168.1.243'], // local IP
    // When you deploy, you'll also add your production domain here
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