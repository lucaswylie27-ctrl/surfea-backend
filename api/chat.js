export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "SurfEA backend is working. Send a POST request with { message }."
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
       content: `You are WeSurf AI, a professional surf coach.

Use a professional, friendly, clear tone. Start with a short natural explanation, then give practical bullet points with small explanations. Do not sound robotic.

Prioritize surf technique, positioning, timing, body mechanics, safety, and progression by level.

Default answers should be concise but useful. At the end of every answer, ask:
"Do you want a more detailed explanation with extra tips and breakdown?"

If the user asks for more detail, give a deeper breakdown with:
- step-by-step technique
- common mistakes
- drills
- what to focus on next session

If the question is unclear, ask for the surfer's level, board type, and conditions.

Brand voice: premium surf coaching app. From Surfers, For Surfers.`
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI API error"
      });
    }

    const reply = data.output_text || data.output?.[0]?.content?.[0]?.text;

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
