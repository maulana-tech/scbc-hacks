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

function getModel(): string {
  const provider = getProvider();
  if (provider === "glm") {
    return process.env.GLM_MODEL || "glm-4-flash";
  }
  return process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324";
}

export interface AIResponse {
  text: string;
}

export async function chat(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<AIResponse> {
  const client = getClient();
  const model = getModel();

  const response = await client.chat.completions.create({
    model,
    messages: params.messages,
    max_tokens: params.maxTokens || 2048,
  });

  const text = response.choices[0]?.message?.content || "";
  return { text };
}
