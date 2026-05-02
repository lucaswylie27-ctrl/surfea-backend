import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 PEGÁ ACÁ TU VECTOR STORE ID
const VECTOR_STORE_ID = "vs_69f5507d4a081..."; // <-- reemplazar

export default async function handler(req, res) {
  // 🔹 Para testear en el navegador
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "WeSurf backend is working. Send a POST request with { message }.",
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Missing message",
      });
    }

    // 🔥 RESPUESTA CON TU KNOWLEDGE BASE
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

Use a professional, friendly, clear tone. Start with a short natural explanation, then give practical bullet points with small explanations. Do not sound robotic.

Always prioritize the WeSurf knowledge base (PDF and documents) before using general knowledge.

Focus on:
- technique
- positioning
- timing
- body mechanics
- surf progression

Default answers should be concise but useful.

At the end of every answer, always ask:
"Do you want a more detailed explanation with extra tips and breakdown?"

If the user asks for more detail, provide:
- step-by-step breakdown
- common mistakes
- drills
- what to focus on next session

If the question is unclear, ask for:
- skill level
- board type
- conditions

Brand voice: premium surf coaching app. From Surfers, For Surfers.`,
    });

    return res.status(200).json({
      reply: response.output_text,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
