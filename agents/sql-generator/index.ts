import { chat } from "@/lib/ai";

const SQL_SYSTEM_PROMPT = `You are an expert SQL developer. Your task is to generate accurate, efficient SQL queries based on natural language descriptions.

Return ONLY a JSON object with the following structure:
{
  "query": "the generated SQL query",
  "explanation": "brief explanation of what the query does",
  "warnings": ["any important caveats or considerations"]
}

Guidelines:
- Use appropriate JOINs when needed
- Consider performance (use indexes, avoid SELECT *)
- Add WHERE clauses for filtering
- Use ORDER BY when sorting is mentioned
- Include aggregations (COUNT, SUM, AVG, etc.) when asked
- Use meaningful aliases for tables`;

export async function generateSQL(
  description: string,
  dialect: string = "postgresql"
): Promise<{
  query: string;
  explanation: string;
  warnings: string[];
}> {
  const { text } = await chat({
    messages: [
      { role: "system", content: SQL_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate a ${dialect} SQL query for: ${description}. Return ONLY valid JSON.`,
      },
    ],
    maxTokens: 1024,
  });

  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?$/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      query: text.trim(),
      explanation: "Generated SQL query",
      warnings: ["Unable to parse structured response"],
    };
  }
}