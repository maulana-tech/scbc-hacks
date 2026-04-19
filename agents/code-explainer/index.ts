import { chat } from "@/lib/ai";

const EXPLAINER_SYSTEM_PROMPT = `You are an expert developer who explains code in simple, clear English.

Your task is to explain what a piece of code does in a way that anyone can understand.

Return ONLY a JSON object with the following structure:
{
  "summary": "2-3 sentence high-level summary of what the code does",
  "lineByLine": [
    { "line": "line number or code snippet", "explanation": "what this line does" }
  ],
  "keyConcepts": ["concept 1", "concept 2"],
  "potentialIssues": ["any potential bugs or concerns"]
}

Guidelines:
- Avoid jargon or explain it when you must use it
- Focus on the "why" not just the "what"
- Point out any security concerns
- Note performance implications
- Be helpful but concise`;

export async function explainCode(
  code: string,
  language: string = "javascript"
): Promise<{
  summary: string;
  lineByLine: { line: string; explanation: string }[];
  keyConcepts: string[];
  potentialIssues: string[];
}> {
  const { text } = await chat({
    messages: [
      { role: "system", content: EXPLAINER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Explain this ${language} code in simple terms:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      },
    ],
    maxTokens: 2048,
  });

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?$/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: text.trim(),
      lineByLine: [],
      keyConcepts: [],
      potentialIssues: [],
    };
  }
}