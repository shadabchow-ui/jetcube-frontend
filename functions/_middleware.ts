export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // ✅ Never let middleware interfere with API routes
  if (path === '/api' || path.startsWith('/api/')) {
    return context.next();
  }

  // Allow common static assets / well-known files through
  if (
    path.startsWith('/assets/') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path.startsWith('/sitemap-') ||
    path.startsWith('/category-directory/')
  ) {
    return context.next();
  }

  // Default behavior: let Cloudflare handle static assets and SPA routing
  return context.next();
};
