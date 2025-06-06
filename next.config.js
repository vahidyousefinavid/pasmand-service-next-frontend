/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  // disable: false,
  register: true,
  aggressiveFrontEndNavCaching: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,

});

async function rewrites() {
  const DOMAIN = process.env.DOMAIN_API;
  return [
    {
      source: "/api/:path*",
      destination: DOMAIN + "/api/:path*",
    },
  ];
}

const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  compress: true,
  rewrites,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // images: {
  //   unoptimized: false, // این گزینه نباید حذف بشه
  // },
};

module.exports = withPWA(nextConfig);