export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url)

  // Match all sitemap*.xml
  if (!url.pathname.startsWith('/sitemap')) {
    return fetch(request)
  }

  const key = url.pathname.replace(/^\/+/, '')
  const obj = await env.JETCUBE_R2.get(key)

  if (!obj) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
