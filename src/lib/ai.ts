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

  const prompt = `You are a helpful household finance assistant inside the "Tally" app.
Answer the user's question using ONLY the JSON data below — it is this household's real income and bill/subscription data.
Be concise (2-4 sentences unless a list is clearly needed), friendly, and use the currency symbols already present in the data.
If the data doesn't contain enough information to answer, say so plainly instead of guessing.

HOUSEHOLD DATA:
${JSON.stringify(context)}

QUESTION: ${question}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export type VendorEmailIntent = 'negotiate' | 'cancel' | 'ask';

export interface VendorEmailDraft {
  subject: string;
  body: string;
}

/**
 * Drafts a short, polite email to a vendor/provider about a contract that's
 * coming up for renewal. This is a DRAFT ONLY — the caller is responsible
 * for showing it to a human for review/edits before it is ever sent.
 */
export async function draftVendorEmail(
  expense: { name: string; amount: number; currency: string; billingCycle: string; contractEndDate?: string | null },
  intent: VendorEmailIntent,
  senderName: string
): Promise<VendorEmailDraft> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI assistant is not configured yet. Ask an admin to set GOOGLE_AI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const intentInstruction = {
    negotiate: 'Politely ask for a better rate or a loyalty discount, mentioning we are an existing customer and open to switching if the price is not competitive.',
    cancel: 'Politely request to cancel the contract/service, ask for confirmation and any final steps required, and ask them not to auto-renew it.',
    ask: 'Politely ask what our renewal terms and pricing will be, and whether a better deal is available before it renews.',
  }[intent];

  const prompt = `Write a short, polite, professional email from a customer to a service provider/vendor.

Customer name (sign the email with this): ${senderName}
Service: ${expense.name}
Current price: ${expense.amount} ${expense.currency} (${expense.billingCycle})
${expense.contractEndDate ? `Contract end date: ${expense.contractEndDate}` : ''}

Goal: ${intentInstruction}

Keep it under 120 words, friendly but direct, no excessive pleasantries. Do not invent an account number or personal details beyond the name given.

Respond with ONLY valid JSON in this exact shape, no markdown fences:
{"subject": "...", "body": "..."}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to generate an email draft. Please try again.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.subject || !parsed.body) {
    throw new Error('Failed to generate an email draft. Please try again.');
  }

  return { subject: String(parsed.subject), body: String(parsed.body) };
}

export type MoneyFlowInsightType = 'idle_cash' | 'timing_risk' | 'consolidation' | 'savings' | 'general';
export type MoneyFlowSeverity = 'info' | 'warning' | 'opportunity';

export interface MoneyFlowInsight {
  type: MoneyFlowInsightType;
  title: string;
  description: string;
  severity: MoneyFlowSeverity;
}

export interface MoneyFlowAnalysis {
  summary: string;
  insights: MoneyFlowInsight[];
}

/**
 * Analyzes a household's real money movement (accounts, transfers, goals,
 * recurring bills/income) and returns a short summary plus a handful of
 * concrete, actionable insights — idle cash sitting in low/no-interest
 * accounts, direct-debit timing risk against income landing dates,
 * consolidation opportunities across accounts, and savings suggestions.
 */
export async function analyzeMoneyFlow(context: unknown): Promise<MoneyFlowAnalysis> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('AI assistant is not configured yet. Ask an admin to set GOOGLE_AI_API_KEY.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `You are a sharp, practical household finance analyst inside the "Tally" app.
Analyse the JSON data below — this household's real accounts, logged money-transfer history, savings goals, and recurring bills/income — and find concrete opportunities to streamline their money flow.

Look specifically for:
- idle_cash: money sitting in low/no-interest current or savings accounts that could work harder.
- timing_risk: direct debits / recurring bills that land before income typically arrives in the same account, risking overdraft or late fees.
- consolidation: overlapping or fragmented accounts that could be simplified (e.g. too many accounts with small balances, or bills spread across many accounts unnecessarily).
- savings: concrete ways to redirect money towards their savings goals faster, based on actual surplus/idle cash seen in the data.
- general: anything else notable about their money movement worth flagging.

Only use the data provided — do not invent account names, amounts, or dates that aren't in it. If there isn't enough data for a category, skip it rather than guessing. Return at most 5 insights, prioritised by real financial impact.

HOUSEHOLD DATA:
${JSON.stringify(context)}

Respond with ONLY valid JSON in this exact shape, no markdown fences:
{"summary": "2-3 sentence plain-English overview", "insights": [{"type": "idle_cash|timing_risk|consolidation|savings|general", "title": "short title", "description": "1-3 sentences, specific and actionable", "severity": "info|warning|opportunity"}]}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to analyse money flow. Please try again.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.summary || !Array.isArray(parsed.insights)) {
    throw new Error('Failed to analyse money flow. Please try again.');
  }

  const validTypes: MoneyFlowInsightType[] = ['idle_cash', 'timing_risk', 'consolidation', 'savings', 'general'];
  const validSeverities: MoneyFlowSeverity[] = ['info', 'warning', 'opportunity'];

  const insights: MoneyFlowInsight[] = parsed.insights
    .filter((i: unknown): i is Record<string, unknown> => !!i && typeof i === 'object')
    .map((i: Record<string, unknown>) => ({
      type: validTypes.includes(i.type as MoneyFlowInsightType) ? (i.type as MoneyFlowInsightType) : 'general',
      title: String(i.title || 'Insight'),
      description: String(i.description || ''),
      severity: validSeverities.includes(i.severity as MoneyFlowSeverity) ? (i.severity as MoneyFlowSeverity) : 'info',
    }))
    .filter((i: MoneyFlowInsight) => i.description.length > 0)
    .slice(0, 5);

  return { summary: String(parsed.summary), insights };
}
