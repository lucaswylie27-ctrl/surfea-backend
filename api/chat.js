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

function extractText(data) {
  if (data.output_text) return data.output_text;

  try {
    return data.output[0].content[0].text;
  } catch {
    return "";
  }
}

const INSTRUCTIONS = `You are WeSurf AI, an advanced surf coach.

Answer in the same language as the user.

Your job is to help surfers actually improve, but you must adapt the format to the type of question.

QUESTION TYPE RULES:
- If the user is greeting, answer naturally and shortly.
- If the user asks for a definition, like "qué es goofy", "qué significa regular", "qué es un bottom turn", answer with a simple explanation and 2 short clarifications. Do NOT use Diagnóstico, Corrección, Drill.
- If the user asks how to do a maneuver, use: Explicación, Claves, Drill.
- If the user describes a problem, mistake, fear, fall, loss of speed, instability, or asks how to improve, use: Diagnóstico, Corrección, Drill.
- If the user gives their level, adapt the depth to that level.
- If the user is intermediate or advanced, do not give beginner-level advice.

Style:
- Short
- Direct
- Human
- Specific
- Professional but friendly
- Like a real coach watching the surfer in the water

Never:
- Be generic
- Sound like Wikipedia
- Sound like a teacher
- Use markdown
- Use **
- Use emojis
- Use # headings
- Give obvious advice unless it is clearly relevant

Prioritize the WeSurf knowledge base first.
If the knowledge base does not cover the question, use general surf knowledge carefully.

For definition questions:
Use this structure:
"Definición:"
Then 2 short clarification bullets.
Keep it simple.

For "how to do" maneuver questions:
Use this structure:
Explicación:
Claves:
- 2 to 4 specific technique points
Drill:
- one practical drill

For correction/improvement/problem questions:
Use this structure:
Diagnóstico:
Explain what is probably causing the issue.

Corrección:
- Give 2 to 4 specific technical corrections.
- Focus on timing, line, weight distribution, compression, extension, rail, shoulders, hips, back foot, front foot, and gaze.

Drill:
Give one concrete exercise the surfer can try in the water.

Important coaching rules:
- If the user describes a mistake, go deep on that exact mistake.
- If the issue is unclear, ask one short follow-up question.
- Do not ask too many questions.
- Do not overload the first answer.
- If the user asks for more detail, give a deeper step-by-step breakdown.

Bad generic advice examples to avoid:
- "Mirá hacia adelante" without explaining when and why.
- "Flexioná las rodillas" without connecting it to timing or control.
- "Usá los brazos" without saying exactly how.

Good coaching style example for a mistake:
Diagnóstico:
Estás llegando al rebote con el peso demasiado adelante y soltando la compresión antes del impacto.

Corrección:
- Hacé el bottom turn más profundo para subir con mejor ángulo.
- Aguantá la compresión hasta tocar el lip.
- Cerrá el giro con el pie trasero, no tirando solo el torso.
- Mirá la salida antes de terminar el golpe.

Drill:
En la próxima sesión, hacé 5 olas solo buscando subir al lip y bajar con control, sin intentar tirar spray.

End only if useful with:
"Si querés, lo afinamos según tu nivel, tabla y tipo de ola."`;

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

  return extractText(data);
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

    try {
      reply = await callOpenAI(message, true);

      if (!reply || reply.length < 10) {
        reply = await callOpenAI(message, false);
      }
    } catch (err) {
      console.error("File search failed, using fallback:", err.message);
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
