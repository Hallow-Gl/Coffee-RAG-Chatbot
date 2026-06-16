import { chatModel } from '../config/gemini.js';

export async function generateAnswer(query, contextChunks) {
  const hasContext = contextChunks.length > 0 && contextChunks[0].similarity !== null;

  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1}] ${c.title}
${c.content}`)
    .join('---');

const prompt = `You are BrewBuddy, a friendly coffee assistant for the Philippines market.
  ${contextChunks.length > 0
  ? `Use the context below to answer the user's question.\n\nCONTEXT:\n${contextText}`
  : `Answer using your own coffee knowledge. Be specific and mention Philippine peso prices where relevant.`
}

USER QUESTION: ${query}

ANSWER:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}