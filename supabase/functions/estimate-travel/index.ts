import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { callClaude, extractJsonFromResponse } from '../_shared/claude.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const SYSTEM_PROMPT = `You are a travel time estimator for an ADHD scheduling app. Given two locations, estimate driving time.

IMPORTANT: People with ADHD typically need extra buffer time for:
- Finding keys/wallet/phone before leaving
- Potential detours or wrong turns
- Parking and walking to entrance
- Mental transition time

Return JSON:
{
  "base_minutes": number,       // Realistic driving time in normal traffic
  "traffic_adjustment": number, // Extra minutes for typical traffic (0 if unknown)
  "adhd_buffer": number,        // Extra ADHD-friendly buffer (5-15 min)
  "total_minutes": number,      // Sum of all three
  "gas_disclaimer": string,     // Brief note about gas/tolls if relevant, or null
  "confidence": "high" | "medium" | "low"  // How confident you are in the estimate
}

If you cannot determine locations or they seem invalid, return a conservative estimate with low confidence.
Be realistic but generous — it's better to arrive early than rush.`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { profile_id, from_location, to_location, from_address, to_address } = await req.json();

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: 'profile_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromLabel = from_address || from_location?.address || from_location?.name || 'Home';
    const toLabel = to_address || to_location?.address || to_location?.name || 'Unknown';

    const rawResponse = await callClaude({
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Estimate driving time from "${fromLabel}" to "${toLabel}".`,
      }],
      maxTokens: 512,
      temperature: 0.3,
    });

    const parsed = extractJsonFromResponse(rawResponse);

    if (!parsed || typeof parsed.total_minutes !== 'number') {
      // Fallback: return a conservative default
      const fallback = {
        base_minutes: 20,
        traffic_adjustment: 5,
        adhd_buffer: 10,
        total_minutes: 35,
        gas_disclaimer: 'Could not estimate route. Using conservative default.',
        confidence: 'low',
        fallback: true,
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cache result in travel_times table if we have location IDs
    if (from_location?.id && to_location?.id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: existing } = await supabase
        .from('travel_times')
        .select('id, entry_count, total_minutes')
        .eq('profile_id', profile_id)
        .eq('from_location_id', from_location.id)
        .eq('to_location_id', to_location.id)
        .maybeSingle();

      if (existing) {
        const newCount = existing.entry_count + 1;
        const newTotal = existing.total_minutes + (parsed.total_minutes as number);
        await supabase
          .from('travel_times')
          .update({
            duration_minutes: Math.round(newTotal / newCount),
            entry_count: newCount,
            total_minutes: newTotal,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('travel_times')
          .insert({
            profile_id,
            from_location_id: from_location.id,
            to_location_id: to_location.id,
            duration_minutes: parsed.total_minutes as number,
            entry_count: 1,
            total_minutes: parsed.total_minutes as number,
          });
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Travel estimate error:', error);
    return new Response(
      JSON.stringify({
        base_minutes: 20,
        traffic_adjustment: 5,
        adhd_buffer: 10,
        total_minutes: 35,
        gas_disclaimer: 'Estimation failed. Using conservative default.',
        confidence: 'low',
        fallback: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
