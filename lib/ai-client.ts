import OpenAI from 'openai';

/**
 * Centralized AI Client for Groq (OpenAI-Compatible)
 * Migration from Google Gemini to Groq (Llama 3.3)
 */

const getApiKey = () => {
  return process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
};

export const getGroqClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing. Please set it in your environment variables.');
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    // In Next.js client-side, we allow this only for the Reflection/Report features 
    // where the key is explicitly marked as PUBLIC for local demo purposes.
    dangerouslyAllowBrowser: true, 
  });
};

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Utility to format chat history for OpenAI/Groq
 */
export const formatHistoryForGroq = (history: any[]) => {
  return history.map(msg => ({
    role: msg.role === 'model' || msg.sender === 'ai' ? 'assistant' : 'user',
    content: msg.parts ? msg.parts[0].text : (msg.content || ''),
  }));
};
