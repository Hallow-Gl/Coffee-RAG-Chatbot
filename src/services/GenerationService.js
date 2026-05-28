import { chatModel } from '../config/gemini.js';

export async function generateAnswer(query, contextChunks) {
  const hasContext = contextChunks.length > 0 && contextChunks[0].similarity !== null;

  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1}] ${c.title}
${c.content}`)
    .join('---');

  const prompt = `You are BrewBuddy, a friendly and knowledgeable coffee assistant
for the Philippines market. You help budget-conscious students and young
professionals make smart coffee decisions.

RULES:
- Answer only from the context below. Do not invent facts.
- If context does not fully cover the question, say so honestly.
- Mention Philippine peso prices (₱) when relevant.
- Keep answers concise and practical — no fluff.
- For comparison questions, address both sides directly.
${!hasContext ? '- Note: context may be limited. Give your best general answer.' : ''}

CONTEXT:
${contextText}

USER QUESTION: ${query}

ANSWER:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}