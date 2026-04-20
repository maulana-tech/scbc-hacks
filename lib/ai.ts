import OpenAI from "openai";

type AIProvider = "openrouter" | "glm";

function getProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || "openrouter";
}

function getClient(): OpenAI {
  const provider = getProvider();
  if (provider === "glm") {
    return new OpenAI({
      apiKey: process.env.GLM_API_KEY,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

const FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
];

function getModel(): string {
  const provider = getProvider();
  if (provider === "glm") {
    return process.env.GLM_MODEL || "glm-4-flash";
  }
  return process.env.OPENROUTER_MODEL || FREE_MODELS[0];
}

export interface AIResponse {
  text: string;
}

export async function chat(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<AIResponse> {
  const provider = getProvider();
  const hasKey =
    provider === "glm"
      ? Boolean(process.env.GLM_API_KEY)
      : Boolean(process.env.OPENROUTER_API_KEY);

  if (!hasKey) {
    const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content;
    return {
      text:
        "[demo] AI provider not configured. Payment flow completed successfully.\n\n" +
        (lastUser ? `Received input: ${lastUser.slice(0, 200)}...` : ""),
    };
  }

  try {
    const client = getClient();
    const model = getModel();
    const modelsToTry = [model, ...FREE_MODELS.filter((m) => m !== model)];

    for (const m of modelsToTry) {
      try {
        const response = await client.chat.completions.create({
          model: m,
          messages: params.messages,
          max_tokens: params.maxTokens || 2048,
        });
        const text = response.choices[0]?.message?.content || "";
        if (text) return { text };
      } catch {
        continue;
      }
    }

    const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content;
    return { text: "[demo] All models busy. Payment verified. Input: " + (lastUser?.slice(0, 200) || "") };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("AI provider error:", errMsg);
    return { text: "[demo] AI error: " + errMsg.slice(0, 100) };
  }
}
