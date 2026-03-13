import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse } from '../_shared/claude.ts';

const SYSTEM_PROMPT = `You are Nudgley, an ADHD-friendly scheduling companion. Generate personalized nudges/notifications for a user's day.

NUDGE PRINCIPLES:
- Warm, encouraging, never guilt-tripping
- Celebrate momentum and streaks
- Normalize struggles — ADHD brains have variable energy
- Short and punchy — 1-2 sentences max
- Time-aware: reference what's coming up or what just happened
- Use ADHD strategies: body doubling suggestions, task chunking, transition warnings

NUDGE TYPES:
- "momentum": Celebrating completed blocks ("3 in a row — you're crushing it!")
- "transition": Warning about upcoming block change ("5 min heads-up: switching to Study soon")
- "energy": Energy-aware suggestions ("Peak zone starting — great time for your hard task")
- "break": Suggesting breaks ("You've been going for 90 min — grab water?")
- "encouragement": General motivation ("Hey, even showing up is a win today")
- "reminder": Meal/self-care reminders ("Lunch in 30 min — don't skip it!")

RESPONSE FORMAT:
Return a JSON object:
{
  "nudges": [
    {
      "type": "momentum" | "transition" | "energy" | "break" | "encouragement" | "reminder",
      "message": "The nudge text",
      "trigger_time": "HH:MM",
      "priority": "low" | "medium" | "high"
    }
  ]
}

Generate 4-6 nudges spread throughout the remaining day. Focus on transitions between blocks and energy management. High priority for meals and self-care reminders.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { blocks, current_time, energy_level, completed_count, streak, productivity_zones, treats } = await req.json();

    const context = {
      current_time,
      energy_level: energy_level || 'medium',
      completed_today: completed_count || 0,
      streak: streak || 0,
      productivity_zones: productivity_zones || [],
      treats: treats || [],
      schedule: blocks || [],
    };

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here's my schedule for today. Generate personalized nudges for the rest of my day:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      maxTokens: 1024,
      temperature: 0.8,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback nudges
    return new Response(
      JSON.stringify({
        nudges: [
          { type: 'encouragement', message: "You're doing great — keep going!", trigger_time: current_time, priority: 'low' },
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Nudges error:', error);
    return new Response(
      JSON.stringify({ nudges: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
