export const onRequestGet: PagesFunction = async (context) => {
  // Let Pages serve index.html / static content normally.
  return context.next();
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    return context.next();
  }

  return context.next();
};

  // Let static assets / SPA handle everything else.
  return ctx.next();
};
