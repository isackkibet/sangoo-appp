import type { AIProvider } from "@/lib/ai/config-store";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithProvider(params: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}) {
  const { provider, apiKey, model, messages, temperature, maxTokens } = params;

  if (provider === "groq") {
    return chatWithGroq(apiKey, model, messages, temperature, maxTokens);
  }

  if (provider === "openai") {
    return chatWithOpenAI(apiKey, model, messages, temperature);
  }

  if (provider === "gemini") {
    return chatWithGemini(apiKey, model, messages, temperature);
  }

  return chatWithAnthropic(apiKey, model, messages, temperature, maxTokens);
}

async function chatWithGroq(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 1024
) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq request failed: ${response.status}${detail ? ` - ${detail.slice(0, 300)}` : ""}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "No response returned from Groq.";
}

async function chatWithOpenAI(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature = 0.7
) {
  const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const data = (await response.json()) as { output_text?: string };
  return data.output_text?.trim() || "No response returned from OpenAI.";
}

async function chatWithGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature = 0.7
) {
  const prompt = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: { temperature },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "No response returned from Gemini.";
}

async function chatWithAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 900
) {
  const system = messages.find((message) => message.role === "system")?.content || "";
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: conversation,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return data.content?.map((item) => item.text || "").join("").trim() || "No response returned from Anthropic.";
}
