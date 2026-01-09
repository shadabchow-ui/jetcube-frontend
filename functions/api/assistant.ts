import OpenAI from "openai";

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const body = await request.json();
    const { messages, product } = body;

    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Scout, a shopping assistant. Answer clearly, concisely, and only about the product."
        },
        ...messages
      ],
      temperature: 0.4
    });

    return new Response(
      JSON.stringify({
        answer: completion.choices[0].message.content
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

