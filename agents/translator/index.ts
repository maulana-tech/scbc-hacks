import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function translate(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; detectedSourceLanguage: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Translate the following text to ${targetLanguage}. Return a JSON object with "translatedText" and "detectedSourceLanguage" fields only.\n\n${text}`,
      },
    ],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";
  const match = responseText.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  return { translatedText: responseText, detectedSourceLanguage: "unknown" };
}
