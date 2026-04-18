import { chat } from "@/lib/ai";

export async function translate(
  text: string,
  targetLanguage: string
): Promise<{ translatedText: string; detectedSourceLanguage: string }> {
  const { text: responseText } = await chat({
    messages: [
      {
        role: "user",
        content: `Translate the following text to ${targetLanguage}. Return a JSON object with "translatedText" and "detectedSourceLanguage" fields only.\n\n${text}`,
      },
    ],
    maxTokens: 2048,
  });

  const match = responseText.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  return { translatedText: responseText, detectedSourceLanguage: "unknown" };
}
