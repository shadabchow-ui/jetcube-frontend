export const onRequestGet: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      route: '/api',
      message: 'API root is live',
    }),
    {
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        'cache-control': 'no-store',
      },
    }
  );
};

// Optional: handle other methods cleanly
export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'GET') {
    return onRequestGet(context);
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET' },
  });
};
