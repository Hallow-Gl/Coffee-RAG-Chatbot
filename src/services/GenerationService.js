import { chatModel } from '../config/gemini.js';

export async function generateAnswer(query, contextChunks) {
  const context = contextChunks.map(c => c.content).join('');

  const prompt = `You are BrewBuddy, a coffee expert for the Philippines market.
Use the context below to answer the user's question.
If the context doesn't cover it, say so honestly.

Context:
${context}

User question: ${query}

Answer:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}