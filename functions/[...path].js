export const onRequestGet = async ({ env, params }) => {
  const key = `indexes/${params.path.join("/")}`;

  const obj = await env.JETCUBE_R2.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
