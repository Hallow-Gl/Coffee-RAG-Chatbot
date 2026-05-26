import { embedModel } from '../config/gemini.js';

export async function embedText(text) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}