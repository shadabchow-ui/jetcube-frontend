import OpenAI from "openai";

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const { messages, product } = await request.json();

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `You are Scout, a shopping assistant. Be concise, helpful, and factual.`
      },
      ...messages
    ]
  });

  return new Response(
    JSON.stringify({
      answer: completion.choices[0].message.content
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
