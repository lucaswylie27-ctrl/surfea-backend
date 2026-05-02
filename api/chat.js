import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VECTOR_STORE_ID = "vs_69f55071d4a081919a1c913bc2f9d9d7";

export default async function handler(req, res) {
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

STYLE:
- Professional but friendly
- Natural and easy to read
- Chill but knowledgeable
- Not robotic

RESPONSE FORMAT (VERY IMPORTANT):
- Start with a short explanation (max 2–3 sentences)
- Then use bullet points
- Each bullet should have a short explanation
- Avoid long paragraphs

Keep answers concise and practical.

Always prioritize the WeSurf knowledge base (PDF and documents) before using general knowledge.

Focus on:
- technique
- positioning
- timing
- body mechanics
- surf progression

At the end of every answer, always ask:
"Do you want a more detailed explanation with extra tips and breakdown?"

If the user asks for more detail:
- go deeper into technique
- explain step-by-step
- include mistakes and drills

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
