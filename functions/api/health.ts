export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, route: 'api/health' }), {
    headers: { 'content-type': 'application/json' },
  });
};
