export async function onRequestPost(context) {
  // Cloudflare Pages context
  const { request, env } = context;

  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Gemini API key is not configured on the server." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Call the Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    // We expect the frontend to pass the history if we want context, 
    // but for a simple terminal, just passing the current prompt or simple history is enough.
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: {
        role: "system",
        parts: [{ text: "You are an AI assistant living inside a hidden terminal on the website Sequoia by Haga Pradiva. You should respond in a cool, concise, terminal-like style. Keep your answers brief and directly answer the user." }]
      }
    };

    if (body.history && Array.isArray(body.history)) {
      geminiPayload.contents = body.history;
    }

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    let replyText = "Error: No response from Gemini.";
    
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      replyText = data.candidates[0].content.parts[0].text;
    }

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
