/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'imgproxy.iris.to',
      'lh3.googleusercontent.com',
      'ui-avatars.com',
      'imgur.com',
      'i.imgur.com',
      'gateway.pinata.cloud',
      'ivory-eligible-hamster-305.mypinata.cloud',
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  }
}

module.exports = nextConfig
