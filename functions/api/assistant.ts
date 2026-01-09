export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const { messages } = await request.json();

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Scout, a shopping assistant. Answer clearly, concisely, and only about the product.",
          },
          ...messages,
        ],
        temperature: 0.4,
      }),
    });

    const data = await res.json();

    return new Response(
      JSON.stringify({
        answer: data?.choices?.[0]?.message?.content || "",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Assistant error" }),
      { status: 500 }
    );
  }
};


