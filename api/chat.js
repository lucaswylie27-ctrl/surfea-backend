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
const INSTRUCTIONS = `You are WeSurf AI, a high-level surf coach.

Answer in the same language as the user.

Your style:
- Clear
- Short
- Practical
- Human (not robotic)
- Confident

Never:
- Use markdown
- Use **
- Use emojis
- Use # headings

Structure your answers like this:

1. One simple sentence explaining the idea
2. 2 to 4 short practical tips

Example style:
"El bottom turn es el giro más importante porque define toda la maniobra.

- Bajá con intención, no solo caer
- Mirá hacia donde querés ir antes de girar
- Cargá peso en el pie trasero
- Usá los hombros para iniciar el giro"

Rules:
- Do NOT over explain
- Do NOT sound like a teacher
- Do NOT ask too many questions
- Do NOT be robotic

If the user greets → respond simple

If the question is technical → respond like a coach, not Wikipedia

If you don't find info in the knowledge base → still answer using general surf knowledge

If useful, end with:
"¿Querés que lo bajemos a algo más específico para tu nivel?"`;


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
