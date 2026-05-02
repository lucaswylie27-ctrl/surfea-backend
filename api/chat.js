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
            content: `You are SurfEA AI, a professional surf coach. Be professional but friendly. Start with a short natural explanation, then give clear bullet points with small explanations. Always end with: "Do you want a more detailed explanation with extra tips and breakdown?"`
          },
          {
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
