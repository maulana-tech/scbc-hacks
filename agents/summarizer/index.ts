import { chat } from "@/lib/ai";

export async function summarize(
  text: string,
  style: "bullet" | "paragraph" | "tldr",
  maxLength: number
): Promise<{ summary: string; wordCount: number }> {
  const styleInstructions = {
    bullet: "as bullet points",
    paragraph: "as a concise paragraph",
    tldr: "as a one-line TL;DR",
  };

  const { text: summary } = await chat({
    messages: [
      {
        role: "user",
        content: `Summarize the following text ${styleInstructions[style]}. Maximum ${maxLength} characters. Return ONLY the summary text, nothing else.\n\n${text}`,
      },
    ],
    maxTokens: 1024,
  });

  return {
    summary: summary.trim(),
    wordCount: summary.trim().split(/\s+/).length,
  };
}
