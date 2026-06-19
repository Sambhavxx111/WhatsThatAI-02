const backendUrl = process.env.RENDER_BACKEND_URL

module.exports = {
  async rewrites() {
    if (!backendUrl) return []

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    }
  },
}
