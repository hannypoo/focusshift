import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse } from '../_shared/claude.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const SYSTEM_PROMPT = `You are Nudgley, an ADHD-friendly schedule coach. Analyze the user's recent schedule data and provide helpful, encouraging insights.

TONE:
- Warm and encouraging — celebrate wins first
- No guilt about missed tasks — normalize ADHD challenges
- Practical and specific — actionable tips, not vague advice
- Use simple language, short sentences
- Reference specific patterns you see in the data

ANALYSIS TO PERFORM:
1. **Completion patterns**: What times of day do they complete the most? Least?
2. **Difficulty patterns**: How do they handle hard vs easy tasks?
3. **Category balance**: Are any categories being neglected?
4. **Streak & momentum**: How consistent are they?
5. **Time estimation**: Do tasks take longer than estimated? (ADHD time blindness)
6. **Energy patterns**: When do they seem to have most/least energy?

RESPONSE FORMAT:
Return a JSON object:
{
  "summary": "A 2-3 sentence encouraging overview of their week",
  "insights": [
    {
      "type": "strength" | "pattern" | "suggestion" | "celebration",
      "title": "Short headline",
      "detail": "1-2 sentence explanation",
      "icon": "trophy" | "clock" | "zap" | "target" | "heart" | "star" | "trending-up" | "alert-circle"
    }
  ],
  "top_tip": "One actionable ADHD-specific scheduling tip based on their data",
  "productivity_score": 0-100
}

Return 3-5 insights. Lead with celebrations/strengths, then patterns, then suggestions.
If there's very little data, acknowledge it warmly and give general ADHD scheduling tips.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profile_id, days = 7 } = await req.json();

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: 'profile_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch recent data in parallel
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const [blocksResult, historyResult, summariesResult, profileResult] = await Promise.all([
      supabase
        .from('schedule_blocks')
        .select('title, date, start_time, end_time, duration_minutes, status, is_fixed, is_protected, ai_reason')
        .eq('profile_id', profile_id)
        .gte('date', sinceStr)
        .order('date')
        .order('start_time'),
      supabase
        .from('task_history')
        .select('title, task_type, estimated_minutes, actual_minutes, energy_level, day_of_week, time_of_day, completed_at')
        .eq('profile_id', profile_id)
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false })
        .limit(50),
      supabase
        .from('daily_summaries')
        .select('*')
        .eq('profile_id', profile_id)
        .gte('date', sinceStr)
        .order('date', { ascending: false }),
      supabase
        .from('profiles')
        .select('display_name, streak, productivity_zones, treats')
        .eq('id', profile_id)
        .single(),
    ]);

    const blocks = blocksResult.data || [];
    const history = historyResult.data || [];
    const summaries = summariesResult.data || [];
    const profile = profileResult.data;

    // Compute quick stats for Claude
    const totalBlocks = blocks.length;
    const completed = blocks.filter((b: { status: string }) => b.status === 'completed').length;
    const skipped = blocks.filter((b: { status: string }) => b.status === 'skipped').length;
    const completionRate = totalBlocks > 0 ? Math.round((completed / totalBlocks) * 100) : 0;

    const context = {
      period: `Last ${days} days`,
      stats: {
        total_blocks: totalBlocks,
        completed,
        skipped,
        rescheduled: blocks.filter((b: { status: string }) => b.status === 'rescheduled').length,
        completion_rate: `${completionRate}%`,
      },
      recent_blocks: blocks.slice(0, 40),
      task_history: history.slice(0, 30),
      daily_summaries: summaries,
      profile: profile ? {
        name: profile.display_name,
        streak: profile.streak,
        productivity_zones: profile.productivity_zones,
        treats: profile.treats,
      } : null,
    };

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here's my schedule data for the last ${days} days. Please analyze it and give me coaching insights:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      maxTokens: 1024,
      temperature: 0.7,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback
    return new Response(
      JSON.stringify({
        summary: rawResponse.slice(0, 200),
        insights: [],
        top_tip: "Keep showing up — consistency beats perfection, especially with ADHD.",
        productivity_score: completionRate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Coaching error:', error);
    return new Response(
      JSON.stringify({
        summary: "I couldn't analyze your schedule right now. Try again in a moment.",
        insights: [],
        top_tip: "Small wins count — even checking in is a win!",
        productivity_score: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
