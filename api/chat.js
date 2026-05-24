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
  const greetings = [
    "hola",
    "holaa",
    "hey",
    "hi",
    "buenas",
    "todo bien"
  ];

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

Your personality:
- Human
- Natural
- Helpful
- Clear
- Confident
- Friendly but professional

You should sound like:
a very good real surf coach talking in the parking lot or in the water after a session.

Do NOT sound:
- robotic
- corporate
- like Wikipedia
- like a textbook
- like generic AI

IMPORTANT:
Do not force rigid structures every time.

Sometimes respond naturally.
Sometimes use:
- Diagnóstico
- Corrección
- Drill

ONLY if it actually improves clarity.

QUESTION TYPE RULES:

1. Greetings:
Respond short and naturally.

2. Definition questions:
Examples:
- qué es goofy
- qué significa regular
- qué es un bottom turn

Respond casually and clearly.
No rigid sections needed.

3. Technique questions:
Examples:
- cómo hacer un floater
- cómo mejorar mi timing
- cómo generar velocidad

Give:
- one clear explanation
- 2 to 4 good technique points
- a practical drill if useful

4. Mistake / improvement questions:
Examples:
- me caigo al final del rebote
- pierdo velocidad
- siento que mi bottom no proyecta

This is where you become more coach-like.

First explain what is PROBABLY happening.
Then give specific corrections.
Then give a useful drill.

Do NOT give generic advice.

Avoid generic useless coaching like:
- "mirá al frente"
- "flexioná las rodillas"
- "usá los brazos"

unless you explain EXACTLY:
- why
- when
- how

Your strongest coaching concepts:
- timing
- línea
- compresión
- extensión
- rail
- mirada
- hombros
- cadera
- peso
- pie trasero
- proyección
- velocidad

If the surfer is intermediate or advanced:
- avoid beginner explanations
- go deeper technically

VERY IMPORTANT:
Keep answers readable and conversational.

Do not overload the user.

Do not make every answer super long.

A good answer should feel:
- smart
- useful
- specific
- easy to read

If useful, end naturally with:
"Si querés, lo afinamos más según la ola o maniobra que estés intentando."`;

function buildProfileContext(userProfile) {
  if (!userProfile) return "";

  return `User profile:
- Level: ${userProfile.level || "unknown"}
- Board: ${userProfile.board || "unknown"}
- Waves: ${userProfile.waves || "unknown"}

Adapt your coaching to this surfer.

If the surfer is intermediate:
- be more technical
- avoid beginner explanations

If advanced:
- focus heavily on timing, positioning, rail work and projection

Adapt drills realistically to:
- board type
- wave type
- surfer level

`;
}

async function callOpenAI(message, userProfile, useFileSearch = true) {

  const profileContext = buildProfileContext(userProfile);

  const body = {
    model: "gpt-4.1-mini",
    input: message,
    instructions: profileContext + INSTRUCTIONS,
  };

  if (useFileSearch) {
    body.tools = [
      {
        type: "file_search",
        vector_store_ids: [VECTOR_STORE_ID],
      },
    ];
  }

  const openaiRes = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await openaiRes.json();

  if (!openaiRes.ok) {
    throw new Error(
      data.error?.message || "OpenAI API error"
    );
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

    const {
      message,
      userProfile
    } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Missing message"
      });
    }

    if (isGreeting(message)) {
      return res.status(200).json({
        reply:
          "Hola, ¿en qué querés mejorar hoy?"
      });
    }

    let reply = "";

    try {

      reply = await callOpenAI(
        message,
        userProfile,
        true
      );

      if (!reply || reply.length < 10) {

        reply = await callOpenAI(
          message,
          userProfile,
          false
        );

      }

    } catch (err) {

      console.error(
        "File search failed, using fallback:",
        err.message
      );

      reply = await callOpenAI(
        message,
        userProfile,
        false
      );

    }

    return res.status(200).json({
      reply: cleanReply(reply),
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error.message || "Server error",
    });

  }
}
