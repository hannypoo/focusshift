import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse, truncateForLlm } from '../_shared/claude.ts';

const SYSTEM_PROMPT = `You are an ADHD-friendly rescheduling assistant. When an appointment or task changes, suggest optimal alternatives.

CONSIDERATIONS:
- Minimize wasted trips (group nearby errands)
- Consider travel time between locations
- Don't stack too many demanding tasks together
- Offer 2-3 concrete options (ADHD = decision fatigue)
- Include a "head home and rest" option when appropriate
- Brief, encouraging explanations

Return JSON:
{
  "options": [
    {
      "label": "Short description of option",
      "newDate": "YYYY-MM-DD",
      "newStartTime": "HH:MM",
      "newEndTime": "HH:MM",
      "reason": "Why this works"
    }
  ],
  "nearbyTasks": ["Task that could be done while you're out"],
  "shouldHeadHome": boolean,
  "message": "Friendly explanation of the situation"
}`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const context = truncateForLlm(JSON.stringify(body), 15000);

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `An appointment changed. Suggest rescheduling options.\n\nContext:\n${context}` }],
      maxTokens: 1024,
      temperature: 0.5,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reschedule error:', error);
    return new Response(
      JSON.stringify({ error: 'Rescheduling failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
