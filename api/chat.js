import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VECTOR_STORE_ID = "ACA_VA_TU_VECTOR_STORE_ID"; // lo vamos a crear abajo

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "WeSurf backend is working",
    });
  }

  try {
    const { message } = req.body;

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

Use a professional, friendly, clear tone. Start with a short natural explanation, then give practical bullet points with small explanations.

Always prioritize WeSurf knowledge base first.

End every answer with:
"Do you want a more detailed explanation with extra tips and breakdown?"`,
    });

    res.json({
      reply: response.output_text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
