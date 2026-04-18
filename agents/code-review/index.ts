import Anthropic from "@anthropic-ai/sdk";
import { CODE_REVIEW_SYSTEM_PROMPT, CODE_REVIEW_PROMPT } from "./prompts";

const client = new Anthropic();

export async function reviewCode(
  code: string,
  language: string,
  focus: string
): Promise<{ issues: { line: number; severity: string; message: string }[]; score: number; summary: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: CODE_REVIEW_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: CODE_REVIEW_PROMPT(code, language, focus) },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return text;
}
