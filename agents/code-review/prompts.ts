export const CODE_REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer. Analyze the provided code and return a JSON response with:
- "issues": array of objects with "line" (number), "severity" ("error"|"warning"|"info"), and "message" (string)
- "score": overall quality score 0-100
- "summary": brief text summary of findings

Focus on the requested area. Be thorough but fair. Return ONLY valid JSON, no markdown.`;

export const CODE_REVIEW_PROMPT = (code: string, language: string, focus: string) =>
  `Review this ${language} code with focus on ${focus}:\n\n\`\`\`${language}\n${code}\n\`\`\``;
