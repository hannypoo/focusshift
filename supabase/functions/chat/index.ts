import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse } from '../_shared/claude.ts';

const SYSTEM_PROMPT = `You are FocusShift AI, an ADHD-friendly life management assistant. You help manage a daily schedule, tasks, and goals.

COMMUNICATION STYLE:
- Be warm, encouraging, and concise (ADHD-friendly)
- No guilt or shame — missed tasks are just tasks to reschedule
- Use simple language, short sentences
- When suggesting changes, explain WHY briefly
- Offer multiple-choice options when possible
- Celebrate wins, even small ones! Acknowledge streaks and rewards earned
- If someone skipped a hard task, normalize it — ADHD brains struggle with activation energy

ADHD STRATEGIES TO REFERENCE:
- Body doubling: "Try having someone nearby while you work on this"
- Task chunking: "Want me to break this into smaller pieces?"
- Time blindness: "I'll keep track of time for you"
- Transition support: "Take a 5-min buffer before switching"
- Rewards: Remind them of their earned treats and suggest taking them
- Energy matching: Reference their productivity zones

CAPABILITIES:
- Create, move, delete schedule blocks
- Create and update tasks
- Suggest schedule adjustments
- Answer questions about the schedule
- Provide encouragement and ADHD strategies
- Reference rewards, treats, and daily progress

CONTEXT (injected per request):
{context}

RESPONSE FORMAT:
Return a JSON object:
{
  "message": "Your conversational response to the user",
  "actions": [
    { "type": "create_block|move_block|delete_block|create_task|complete_task|update_task", "data": {...} }
  ],
  "suggestions": [
    { "id": "unique-id", "label": "Button text", "action": { "type": "send_message", "message": "What user would say" } }
  ]
}

Always include 2-3 suggestion chips for follow-up. Actions are optional — only include them when the user asks for a change.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context, history } = await req.json();

    // Enrich context with rewards and summary info
    const enrichedContext = {
      ...context,
      instructions: [
        'Reference their rewards/treats when they complete hard tasks.',
        'If they have a streak going, mention it positively.',
        'When blocks are skipped, suggest rescheduling without guilt.',
        context?.rewards_earned ? `They have earned ${context.rewards_earned} rewards today — celebrate this!` : null,
        context?.daily_summary ? `Yesterday summary: ${JSON.stringify(context.daily_summary)}` : null,
        context?.productivity_zones ? `Productivity zones: ${JSON.stringify(context.productivity_zones)}` : null,
        context?.treats ? `Their favorite treats/rewards: ${context.treats.join(', ')}` : null,
      ].filter(Boolean),
    };

    const systemPrompt = SYSTEM_PROMPT.replace('{context}', JSON.stringify(enrichedContext, null, 2));

    const messages = [
      ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const rawResponse = await callClaude({
      system: systemPrompt,
      messages,
      maxTokens: 1024,
      temperature: 0.7,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: treat as plain text message
    return new Response(
      JSON.stringify({
        message: rawResponse,
        actions: [],
        suggestions: [
          { id: '1', label: "What's next?", action: { type: 'send_message', message: "What should I do next?" } },
          { id: '2', label: 'Show schedule', action: { type: 'send_message', message: "Show me today's schedule" } },
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({
        message: "I'm having trouble connecting right now. Try again in a moment.",
        actions: [],
        suggestions: [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
