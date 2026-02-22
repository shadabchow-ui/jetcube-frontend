// functions/_middleware.ts
export const onRequest = async ({ request, next }: any) => {
  const url = new URL(request.url);

  // NUCLEAR TRAP: Hijack the PDP route immediately
  if (url.pathname.startsWith('/api/pdp/')) {
     return new Response(JSON.stringify({
       ok: true,
       message: "TRAP SUCCESS - THE FUNCTIONS ENGINE IS ALIVE",
       url: url.pathname
     }), {
       status: 200,
       headers: { 
         'content-type': 'application/json', 
         'x-trap': 'active' 
       }
     });
  }

  // Let all other pages and assets load normally
  return next();
}
