/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
  },

  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return [];
    return [
      { source: '/api/applicants/:path*', destination: `${backendUrl}/api/applicants/:path*` },
      { source: '/api/dashboard/:path*',  destination: `${backendUrl}/api/dashboard/:path*`  },
      { source: '/api/jobs/:path*',        destination: `${backendUrl}/api/jobs/:path*`        },
      { source: '/api/screening/:path*',   destination: `${backendUrl}/api/screening/:path*`   },
    ];
  },
};

module.exports = nextConfig;
