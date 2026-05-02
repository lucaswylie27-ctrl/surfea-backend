const VECTOR_STORE_ID = "vs_69f55071d4a081919a1c913bc2f9d9d7";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

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

// 🔥 NUEVO: función para extraer texto correctamente
function extractText(data) {
  if (data.output_text) return data.output_text;

  try {
    return data.output[0].content[0].text;
  } catch {
    return "";
  }
}

const INSTRUCTIONS = `You are WeSurf AI, a professional surf coach.

Answer in the same language as the user.

Never use markdown.
Never use **.
Never use emojis.
Never use # headings.
Use short clean answers.

Sound human, professional and friendly.
Do not sound robotic.
Do not sound like a surfer bro.

For real surf questions:
- Start with 1 short natural sentence.
- Then give 2 to 4 short practical points.
- Use simple hyphen bullets only if useful.
- Keep the first answer short.

Prioritize the WeSurf knowledge base first.
Use general surf knowledge only if needed.

If the question is unclear, ask one simple follow-up question.

If useful, end with:
"¿Querés que lo veamos más en detalle?"`;

async function callOpenAI(message, useFileSearch = true) {
  const body = {
    model: "gpt-4.1-mini",
    input: message,
    instructions: INSTRUCTIONS,
  };

  if (useFileSearch) {
    body.tools = [
      {
        type: "file_search",
        vector_store_ids: [VECTOR_STORE_ID],
      },
    ];
  }

  const openaiRes = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await openaiRes.json();

  if (!openaiRes.ok) {
    throw new Error(data.error?.message || "OpenAI API error");
  }

  return extractText(data); // 🔥 FIX CLAVE
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

    let reply = "";

    // 🔥 intento con PDF
    try {
      reply = await callOpenAI(message, true);
    } catch (err) {
      console.error("File search failed, using fallback:", err.message);

      // 🔥 fallback sin PDF
      reply = await callOpenAI(message, false);
    }

    return res.status(200).json({
      reply: cleanReply(reply),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
