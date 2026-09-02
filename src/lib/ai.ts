import { GoogleGenerativeAI } from '@google/generative-ai';

export function isAiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

/**
 * Asks a household-scoped question against a compact JSON context of the
 * household's own expense data. Never sends data for any other household.
 */
export async function askAboutHouseholdData(question: string, context: unknown): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI assistant is not configured yet. Ask an admin to set GOOGLE_AI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `You are a helpful household finance assistant inside the "Home Alone" app.
Answer the user's question using ONLY the JSON data below — it is this household's real income and bill/subscription data.
Be concise (2-4 sentences unless a list is clearly needed), friendly, and use the currency symbols already present in the data.
If the data doesn't contain enough information to answer, say so plainly instead of guessing.

HOUSEHOLD DATA:
${JSON.stringify(context)}

QUESTION: ${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
