import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse, truncateForLlm } from '../_shared/claude.ts';

const SYSTEM_PROMPT = `You are an ADHD-aware homework estimation assistant. Given assignment details or pasted syllabus text, estimate the time and difficulty.

IMPORTANT ADHD FACTORS:
- Executive function overhead: add 20-50% to neurotypical estimates
- Task initiation difficulty: suggest shorter initial sessions
- Hyperfocus risk: suggest break points
- Working memory: suggest note-taking between sessions

Return JSON:
{
  "title": "Assignment title (inferred from text)",
  "type": "essay|reading|problem_set|project|quiz_prep",
  "difficulty": 1-10,
  "neurotypicalMinutes": total minutes a neurotypical student would need,
  "adhdAdjustedMinutes": total minutes with ADHD factors (1.5-2x),
  "sessions": [
    { "title": "Session name", "minutes": estimated_minutes }
  ],
  "milestones": ["Milestone 1", "Milestone 2"]
}

Break work into 25-45 minute sessions. Include a "review/polish" session at the end.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, courseName } = await req.json();

    const truncated = truncateForLlm(text || '', 10000);
    const userMessage = courseName
      ? `Course: ${courseName}\n\nAssignment text:\n${truncated}`
      : `Assignment text:\n${truncated}`;

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 1024,
      temperature: 0.3,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to parse AI response' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Estimate error:', error);
    return new Response(
      JSON.stringify({ error: 'Estimation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
