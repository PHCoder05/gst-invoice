/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://vercel.live https://*.vercel.app; connect-src 'self' https://api.razorpay.com https://vercel.live https://*.vercel.app https://bctyvhykgrytmtmubwvt.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://vercel.live https://*.vercel.app;"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 