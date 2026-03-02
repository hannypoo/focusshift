import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse, truncateForLlm } from '../_shared/claude.ts';

const SYSTEM_PROMPT = `You are an ADHD-optimized schedule generator. Create a daily schedule that accounts for:

ADHD PRINCIPLES:
- High-priority tasks when energy is highest (use productivity zones)
- Frequent transitions (5-10 min breaks between tasks)
- Protected time for critical categories
- Buffer time before appointments (travel + ADHD buffer)
- Avoid back-to-back demanding tasks
- Include self-care blocks even on busy days
- Respect neglect scores — prioritize neglected categories
- Match task difficulty to energy zones (hard tasks at peak hours, easy at low)

PRODUCTIVITY ZONES:
- "peak" hours: Schedule hard/demanding tasks here
- "low" hours: Schedule easy/mindless tasks, chores, errands
- "dead" hours: Only relaxation, no productive tasks

DIFFICULTY MATCHING:
- Hard tasks → peak energy hours only
- Medium tasks → peak or low hours
- Easy tasks → any non-dead hours

TRAVEL & BUFFERS:
- Insert travel blocks before location-based appointments
- Add 5-min ADHD buffer after travel (find keys, get settled)
- Wake-up buffer: gentle start, no hard tasks for first 15-30 min
- Wind-down buffer: no stimulating tasks in last 30 min

RULES:
- Never schedule before wake_time or after wind_down_time
- Fixed/protected events cannot be moved
- Include ai_reason for each block explaining why it's placed there
- Keep blocks between 15-90 minutes
- Travel blocks before location-based appointments
- Meals and self-care are non-negotiable anchors
- Reference difficulty when explaining placement decisions

Return JSON:
{
  "blocks": [
    {
      "title": "Block name",
      "category_id": "category-id",
      "task_id": "task-id or null",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration_minutes": number,
      "is_fixed": boolean,
      "is_protected": boolean,
      "is_transition": boolean,
      "is_travel": boolean,
      "is_prep": boolean,
      "is_meal": boolean,
      "is_self_care": boolean,
      "is_buffer": boolean,
      "is_chore_block": boolean,
      "block_type": "task|meal|self_care|buffer|travel|prep|chore",
      "difficulty": "easy|medium|hard|null",
      "ai_reason": "Why this block is here"
    }
  ],
  "notes": "Brief summary of scheduling decisions"
}`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const context = truncateForLlm(JSON.stringify(body), 20000);

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate an optimized schedule for today.\n\nContext:\n${context}` }],
      maxTokens: 2048,
      temperature: 0.5,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed && Array.isArray((parsed as Record<string, unknown>).blocks)) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate schedule', fallback: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Schedule generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Schedule generation failed', fallback: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
