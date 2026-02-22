import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async ({ params, request }) => {
  const slug = String(params?.slug ?? '');

  return new Response(
    JSON.stringify(
      {
        ok: true,
        proof: 'PDP handler hit',
        file: 'functions/api/pdp/[slug].ts',
        slug,
        url: request.url,
        ts: Date.now(),
      },
      null,
      2
    ),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-pdp-proof': 'hit',
      },
    }
  );
};
