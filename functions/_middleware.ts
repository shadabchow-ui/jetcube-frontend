// functions/_middleware.ts
export const onRequest = async (ctx: any) => {
  const url = new URL(ctx.request.url);

  // NUCLEAR TRAP: Intercept the exact PDP route immediately
  if (url.pathname.startsWith('/api/pdp/')) {
     return new Response(JSON.stringify({
       ok: true,
       message: "MIDDLEWARE TRAP SUCCESS - THE WORKER IS ALIVE",
       url: url.pathname
     }), {
       status: 200,
       headers: { 
         'content-type': 'application/json', 
         'x-trap': 'active' 
       }
     });
  }

  // Let everything else pass through normally
  return ctx.next();
}
