import { convertToModelMessages, stepCountIs, streamText, tool, validateUIMessages } from 'ai';
import { z } from 'zod';
import { createGroq } from '@ai-sdk/groq';

export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    const tools = {
      updateFilters: tool({
        description: 'Update the dashboard filters (priority, city, state, area type). If a user asks to see high priority items, you must call this.',
        inputSchema: z.object({
          priority: z.enum(['all', 'high', 'medium', 'low']).optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          status: z.enum(['all', 'reported', 'in-progress', 'repaired']).optional(),
          areaType: z.enum(['all', 'urban', 'rural']).optional(),
        }),
        execute: async ({ priority, city, state, status, areaType }) => {
          const activeFilters = [
            priority ? `priority ${priority}` : null,
            city ? `city ${city}` : null,
            state ? `state ${state}` : null,
            status ? `status ${status}` : null,
            areaType ? `area type ${areaType}` : null,
          ].filter(Boolean);

          return activeFilters.length > 0
            ? `Applied filters: ${activeFilters.join(', ')}.`
            : 'Filters updated.';
        },
      }),
      setMapCenter: tool({
        description: 'Change the map center to a new [lat, lng] coordinate. Use this to focus the map on a target city.',
        inputSchema: z.object({
          lat: z.number().describe('Latitude coordinate'),
          lng: z.number().describe('Longitude coordinate'),
        }),
        execute: async ({ lat, lng }) => `Map centered to ${lat}, ${lng}.`,
      }),
      selectPothole: tool({
        description: 'Open the detail view for a specific pothole ID.',
        inputSchema: z.object({
          id: z.string(),
        }),
        execute: async ({ id }) => `Selected pothole ${id}.`,
      }),
    } as any;

    const validatedMessages = await validateUIMessages({
      messages,
      tools,
    });

    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      stopWhen: stepCountIs(5),
      system: `You are the WayScan dashboard assistant. You can intelligently apply filters, center the dashboard map, and extract context from the dashboard data.
      IMPORTANT: You should respond CONCISELY. Avoid writing bulleted lists or rich markdown because your response might be read ALOUD using Text-to-Speech to the user.
      When the user asks to filter or change map views, ALWAYS invoke the appropriate tool.
      For reference, Mumbai is located at [19.0760, 72.8777], Delhi at [28.6139, 77.2090], Bangalore/Bengaluru at [12.9716, 77.5946], Jabalpur at [23.1815, 79.9864].`,
      messages: await convertToModelMessages(validatedMessages, {
        tools,
        ignoreIncompleteToolCalls: true,
      }),
      tools,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
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