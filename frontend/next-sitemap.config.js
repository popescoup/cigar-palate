/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://cigarpalate.com',
    generateRobotsTxt: true,
    generateIndexSitemap: true,
    exclude: [
      '/admin/*',
      '/auth-required/*',
      '/token-test/*',
      '/api/*',
      '/forgot-password/*',
      '/reset-password/*',
      '/verify-email/*'
    ],
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          disallow: ['/admin', '/auth-required', '/token-test', '/api']
        }
      ]
    }
  }