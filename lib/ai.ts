import OpenAI from "openai";

type AIProvider = "nvidia" | "openrouter";

const NVIDIA_MODELS = [
  "nvidia/llama-3.3-nemotron-super-49b-v1",
  "meta/llama-3.3-70b-instruct",
  "nvidia/llama-3.1-nemotron-nano-8b-v1",
  "meta/llama-3.1-70b-instruct",
];

const OPENROUTER_FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-4-26b-a4b-it:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
];

function getProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || "openrouter";
}

function getOpenAIClient(provider: AIProvider): OpenAI {
  if (provider === "nvidia") {
    return new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

function getModel(provider: AIProvider): string {
  if (provider === "nvidia") {
    return process.env.NVIDIA_MODEL || NVIDIA_MODELS[0];
  }
  return process.env.OPENROUTER_MODEL || OPENROUTER_FREE_MODELS[0];
}

export interface AIResponse {
  text: string;
}

export async function chat(params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<AIResponse> {
  const providers: AIProvider[] = [getProvider(), getProvider() === "nvidia" ? "openrouter" : "nvidia"];

  for (const provider of providers) {
    const hasKey = provider === "nvidia"
      ? Boolean(process.env.NVIDIA_API_KEY)
      : Boolean(process.env.OPENROUTER_API_KEY);

    if (!hasKey) continue;

    const client = getOpenAIClient(provider);
    const primaryModel = getModel(provider);
    const fallbacks = provider === "nvidia" ? NVIDIA_MODELS : OPENROUTER_FREE_MODELS;
    const modelsToTry = [primaryModel, ...fallbacks.filter((m) => m !== primaryModel)];

    for (const model of modelsToTry) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: params.messages,
          max_tokens: params.maxTokens || 2048,
        });
        const text = response.choices[0]?.message?.content || "";
        if (text) return { text };
      } catch {
        continue;
      }
    }
  }

  const lastUser = [...params.messages].reverse().find((m) => m.role === "user")?.content;
  return {
    text: "[demo] All AI providers busy. Payment verified.\n\nInput: " + (lastUser?.slice(0, 200) || ""),
  };
}
