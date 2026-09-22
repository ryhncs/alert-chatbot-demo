import { buildSystemPrompt, articlesFor } from "./knowledge-base.mjs";

// POST /api/chat
// body: { messages: [{ role: "user"|"assistant", text: string }], image?: { mimeType, data (base64, no prefix) } }
export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse(
      {
        reply:
          "Demo isn't wired up yet — the site owner needs to add a GEMINI_API_KEY in the project's environment variables.",
      },
      500
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (messages.length === 0) {
    return jsonResponse({ error: "messages is required" }, 400);
  }

  const lastUserText = [...messages].reverse().find((m) => m.role === "user")?.text || "";

  // Build Gemini "contents" from the running conversation.
  const contents = messages.map((m, i) => {
    const parts = [{ text: m.text || "" }];
    // Attach the image only to the most recent user turn that carries one.
    if (m.image && i === messages.length - 1) {
      parts.push({
        inline_data: { mime_type: m.image.mimeType, data: m.image.data },
      });
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const payload = {
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
      // Newer Gemini models spend part of maxOutputTokens on internal "thinking"
      // before writing the reply, which can leave nothing for the actual answer
      // (finishReason: MAX_TOKENS with empty text). Turn that off for a plain
      // chat reply — we don't need multi-step reasoning here.
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let reply = "Sorry, I'm having trouble connecting right now — please try again in a moment, or call us on (03) 8820 6567.";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      const parsed = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("");
      if (parsed) {
        reply = parsed;
      } else {
        // 200 OK but no usable text — usually a safety block or a truncated response.
        // Log the reason instead of silently falling back, so this is diagnosable.
        console.error(
          "Gemini returned no text",
          "blockReason:", data?.promptFeedback?.blockReason,
          "finishReason:", data?.candidates?.[0]?.finishReason,
          JSON.stringify(data).slice(0, 800)
        );
      }
    } else {
      console.error("Gemini error", res.status, JSON.stringify(data).slice(0, 500));
    }
  } catch (err) {
    console.error("Gemini fetch failed", err);
  }

  const relatedArticles = articlesFor(lastUserText + " " + reply);

  return jsonResponse({ reply, articles: relatedArticles });
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  path: "/api/chat",
};
