//@ts-check


import { composePlugins, withNx } from '@nx/next';

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    frame-src 'self' http://localhost:* http://127.0.0.1:*;
    connect-src 'self' http://localhost:* http://127.0.0.1:*;
    img-src 'self' blob: data: https://api.slingacademy.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' http://localhost:* http://127.0.0.1:*;
    upgrade-insecure-requests;
`

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },

  transpilePackages: ["@fwd/ui"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },

  experimental: {
    instrumentationHook: true,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);

