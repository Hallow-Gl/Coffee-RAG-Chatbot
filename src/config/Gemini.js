import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY env var');
}

export const genAI = new GoogleGenerativeAI(apiKey);
export const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
export const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });