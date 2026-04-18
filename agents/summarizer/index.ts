import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Summarize the following text ${styleInstructions[style]}. Maximum ${maxLength} characters. Return ONLY the summary text, nothing else.\n\n${text}`,
      },
    ],
  });

  const summary = message.content[0].type === "text" ? message.content[0].text : "";
  return {
    summary: summary.trim(),
    wordCount: summary.trim().split(/\s+/).length,
  };
}
