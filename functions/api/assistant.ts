import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  OPENAI_API_KEY?: string;
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8');
  if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray((body as any)?.messages) ? (body as any).messages : [];

    if (!env?.OPENAI_API_KEY) {
      return json({ error: 'Missing OPENAI_API_KEY binding' }, { status: 500 });
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are Scout, a shopping assistant. Answer clearly, concisely, and focus on the product context.',
          },
          ...messages,
        ],
        temperature: 0.4,
      }),
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return json(
        {
          error: 'Upstream assistant request failed',
          status: upstream.status,
          details: data,
        },
        { status: 502 }
      );
    }

    const answer = (data as any)?.choices?.[0]?.message?.content ?? '';
    return json({ answer, raw: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assistant error';
    return json({ error: message }, { status: 500 });
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'POST') return onRequestPost(context);

  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    return json({ ok: true, route: '/api/assistant', status: 'online' });
  }

  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET, HEAD, POST' },
  });
};
