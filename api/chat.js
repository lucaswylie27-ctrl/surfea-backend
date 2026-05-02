import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VECTOR_STORE_ID = "vs_69f55071d4a081919a1c913bc2f9d9d7";

// 🔥 Limpieza fuerte de texto
function cleanReply(text) {
  if (!text) return "";

  return text
    .replace(/\*\*/g, "") // elimina bold
    .replace(/#{1,6}\s?/g, "") // elimina #
    .replace(/[🌊🏄‍♂️🏄🔥✅❌👉]/g, "") // elimina emojis
    .replace(/regular|goofy/gi, (match) => match.toLowerCase()) // normaliza
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// 🔥 detectar si es solo saludo
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

    // 🔥 si es saludo, responder humano simple SIN IA
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

CRITICAL RULES:
- NEVER use ** or markdown formatting.
- NEVER use emojis.
- NEVER use # or headings.
- ALWAYS use plain clean text.

LANGUAGE:
- Match user language exactly.
- If Spanish, answer 100% Spanish.

STYLE:
- Sound human, not robotic.
- Professional but relaxed.
- No "surfer bro".

BEHAVIOR:
- If the user asks a real question → answer shortly.
- If the user is vague → ask ONE simple follow-up.
- Do NOT over-explain at first.

FORMAT:
- Max 2 short sentences intro.
- Then 2-4 simple bullet points using "-".
- Keep everything short.

KNOWLEDGE:
- Always prioritize WeSurf documents.
- Use general knowledge only if needed.

ENDING:
- Only add follow-up question if it makes sense.

Example ending:
"¿Querés que lo veamos más en detalle?"

DO NOT overload the user.`,
    });

    const reply = cleanReply(response.output_text);

    return res.status(200).json({ reply });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
