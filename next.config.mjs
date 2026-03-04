import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {}, // Silences the Webpack config conflict error caused by next-pwa in Next 16+
  async rewrites() {
    return [
      {
        source: '/__/auth/handler',
        destination: 'https://countdown-70caa.firebaseapp.com/__/auth/handler',
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);
