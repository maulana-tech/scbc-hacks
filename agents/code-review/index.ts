import { chat } from "@/lib/ai";
import { CODE_REVIEW_SYSTEM_PROMPT, CODE_REVIEW_PROMPT } from "./prompts";

export async function reviewCode(
  code: string,
  language: string,
  focus: string
): Promise<{
  issues: { line: number; severity: string; message: string }[];
  score: number;
  summary: string;
}> {
  const { text } = await chat({
    messages: [
      { role: "system", content: CODE_REVIEW_SYSTEM_PROMPT },
      { role: "user", content: CODE_REVIEW_PROMPT(code, language, focus) },
    ],
    maxTokens: 2048,
  });

  return JSON.parse(extractJSON(text));
}

function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return text;
}
