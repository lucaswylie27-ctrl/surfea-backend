import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VECTOR_STORE_ID = "vs_69f55071d4a081919a1c913bc2f9d9d7";

function cleanReply(text) {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s?/g, "")
    .replace(/[🌊🏄‍♂️🏄🔥✅❌👉]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isGreeting(msg) {
  const greetings = ["hola", "hey", "hi", "buenas", "holaa"];
  return greetings.includes(msg.toLowerCase().trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "WeSurf backend is working.",
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    if (isGreeting(message)) {
      return res.status(200).json({
        reply: "Hola, ¿en qué te puedo ayudar con tu surf?",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID],
        },
      ],
      instructions: `You are WeSurf AI, a professional surf coach.

Answer in the same language as the user.

Never use markdown.
Never use **.
Never use emojis.
Never use # headings.
Use short clean answers.

Sound human, professional and friendly.
Do not sound robotic.
Do not sound like a surfer bro.

If the user only greets you, answer naturally and do not give coaching advice.

For real surf questions:
- Start with 1 short natural sentence.
- Then give 2 to 4 short practical points.
- Use simple hyphen bullets only if useful.
- Keep the first answer short.

Prioritize the WeSurf knowledge base first.
Use general surf knowledge only if needed.

If the question is unclear, ask one simple follow-up question.

If useful, end with:
"¿Querés que lo veamos más en detalle?"`,
    });

    return res.status(200).json({
      reply: cleanReply(response.output_text),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
