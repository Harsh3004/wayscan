import { createGroq } from '@ai-sdk/groq';
import { convertToModelMessages, streamText } from 'ai';
import { buildCompactDashboardChatContext, buildDashboardChatContext } from '@/lib/chat-context';
import { mockDashboardStats, potholes } from '@/lib/mock-data';

export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function normalizeMessages(messages: unknown[]): unknown[] {
  return messages
    .map((message: any) => {
      if (!message || typeof message !== 'object') {
        return null;
      }

      if (Array.isArray(message.parts)) {
        return message;
      }

      const text = typeof message.content === 'string'
        ? message.content
        : typeof message.text === 'string'
          ? message.text
          : '';

      return {
        ...message,
        content: text,
        parts: text ? [{ type: 'text', text }] : [],
      };
    })
    .filter(Boolean);
}

function buildSystemPrompt(dashboardContext: unknown): string {
  return [
    'You are the WayScan dashboard assistant.',
    'Answer questions using the dashboard snapshot below.',
    'Keep responses short, speakable, and direct. Use one or two short sentences.',
    'Use stats.totalActive as the authoritative active pothole total.',
    'Use stats.criticalHazards, stats.repairedThisMonth, stats.avgResolutionTime, and stats.pendingSync for KPI questions.',
    'Use recentDetections, criticalPotholes, cityBreakdown, and potholeClusters for pothole-specific questions and city summaries.',
    'When asked about a specific pothole, mention its location, city, priority, status, reports, vehicles, and lastDetected when available.',
    'If the snapshot does not contain the answer, say you do not have that detail.',
    '',
    'Dashboard snapshot:',
    JSON.stringify(dashboardContext),
  ].join('\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const normalizedMessages = normalizeMessages(messages);
    const dashboardContext =
      body?.dashboardContext && typeof body.dashboardContext === 'object'
        ? body.dashboardContext
        : buildDashboardChatContext(potholes, mockDashboardStats);
    const compactDashboardContext = buildCompactDashboardChatContext(dashboardContext as any);

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      temperature: 0.2,
      maxOutputTokens: 120,
      system: buildSystemPrompt(compactDashboardContext),
      messages: await convertToModelMessages(normalizedMessages as any),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (error) => {
        if (error instanceof Error) {
          console.error('Chat stream error:', error.message);
          return error.message;
        }

        console.error('Chat stream error:', error);
        return 'An unexpected error occurred while generating the response.';
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), { status: 500 });
  }
}