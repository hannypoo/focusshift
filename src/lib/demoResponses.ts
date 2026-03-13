import type { ChatResponse, Suggestion } from '../types';
import type { ScheduleBlock } from '../types/database';

// Tracks multi-turn demo conversations (e.g., grocery follow-up)
let pendingScenario: string | null = null;

export function resetDemoConversation() {
  pendingScenario = null;
}

/**
 * Checks if a message matches a pre-seeded demo scenario.
 * Returns a ChatResponse if matched, or null to fall through to the real AI.
 */
export function getDemoResponse(
  message: string,
  blocks: ScheduleBlock[]
): ChatResponse | null {
  const msg = message.toLowerCase().trim();

  // ─── Follow-up to grocery scenario ────────────────────────────
  if (pendingScenario === 'grocery') {
    pendingScenario = null;

    if (msg.includes('quick') || msg.includes('safeway') || msg.includes('small')) {
      return {
        message: "Got it — quick Safeway run! I've added a 30-minute grocery block after your next appointment. In and out! 🛒",
        actions: [{ type: 'create_block', data: { title: 'Grocery — Safeway', duration: 30, category: 'errands', difficulty: 'easy' } }],
        suggestions: [
          { id: 's1', label: 'Add something else', action: { type: 'send_message', message: 'I need to add another task' } },
          { id: 's2', label: "What's next?", action: { type: 'send_message', message: "What's my next task?" } },
        ],
      };
    }

    if (msg.includes('big') || msg.includes('costco') || msg.includes('large')) {
      return {
        message: "Big Costco run it is! I've blocked out 60 minutes after your next appointment. Don't forget your list! 📋",
        actions: [{ type: 'create_block', data: { title: 'Grocery — Costco', duration: 60, category: 'errands', difficulty: 'medium' } }],
        suggestions: [
          { id: 's1', label: 'Add something else', action: { type: 'send_message', message: 'I need to add another task' } },
          { id: 's2', label: "What's next?", action: { type: 'send_message', message: "What's my next task?" } },
        ],
      };
    }

    // Unmatched grocery follow-up — default to quick trip
    return {
      message: "I'll add a 30-minute grocery block after your next appointment. You can always adjust it later! 🛒",
      actions: [{ type: 'create_block', data: { title: 'Grocery run', duration: 30, category: 'errands', difficulty: 'easy' } }],
      suggestions: [
        { id: 's1', label: 'Add something else', action: { type: 'send_message', message: 'I need to add another task' } },
        { id: 's2', label: "What's next?", action: { type: 'send_message', message: "What's my next task?" } },
      ],
    };
  }

  // ─── Scenario 1: Grocery / store ──────────────────────────────
  if (msg.includes('grocery') || msg.includes('store') || msg.includes('shopping')) {
    pendingScenario = 'grocery';
    return {
      message: "Sure! Quick question — are we talking a quick Safeway trip or a big Costco run? That changes how much time I should block out. 🤔",
      suggestions: [
        { id: 'g1', label: 'Quick Safeway trip', action: { type: 'send_message', message: 'Quick Safeway' } },
        { id: 'g2', label: 'Big Costco run', action: { type: 'send_message', message: 'Big Costco run' } },
      ],
    };
  }

  // ─── Scenario 2: Energy crash ─────────────────────────────────
  if (msg.includes('energy') && (msg.includes('crash') || msg.includes('tank') || msg.includes('low') || msg.includes('tired') || msg.includes('exhausted') || msg.includes('drained'))) {
    return {
      message: "Got it — I've adjusted your schedule. Moved your hard tasks to tomorrow, shortened the remaining blocks, and added a 15-minute energy break. Take it easy. 💛",
      actions: [
        { type: 'create_block', data: { rescheduleHard: true } },
        { type: 'create_block', data: { shortenBlocks: true } },
        { type: 'create_block', data: { title: 'Energy Break — rest up', duration: 15, category: 'self-care', difficulty: 'easy', isSelfCare: true } },
      ],
      suggestions: [
        { id: 'e1', label: "What's left today?", action: { type: 'send_message', message: "What do I still have today?" } },
        { id: 'e2', label: 'I feel better now', action: { type: 'send_message', message: 'My energy is back up' } },
      ],
    };
  }

  // ─── Scenario 3: Time crunch / reprioritization ───────────────
  if (msg.includes('lost track') || msg.includes('class in') || msg.includes('have to leave') || msg.includes('running late') || msg.includes('behind') || msg.includes('have to be') || msg.includes('need to go')) {
    return {
      message: "Okay, let's focus on what matters most right now:\n\n1. **Quick shower** — just hair and body, 10 minutes max\n2. **Simple outfit** — jeans, clean top, shoes that go with everything\n3. **Grab-and-go** — granola bar or banana on the way out\n\nI've cleared your non-essential tasks and put getting ready first. You've got this! 💪",
      actions: [
        { type: 'create_block', data: { clearNonEssential: true } },
        { type: 'create_block', data: { title: 'Get ready — quick prep', duration: 20, category: 'self-care', difficulty: 'easy', isSelfCare: true, priority: true } },
      ],
      suggestions: [
        { id: 'r1', label: "What time do I need to leave?", action: { type: 'send_message', message: "When should I leave?" } },
        { id: 'r2', label: "I'm ready, what's next?", action: { type: 'send_message', message: "I'm ready to go, what now?" } },
      ],
    };
  }

  // ─── No match — fall through to real AI or fallback ───────────
  return null;
}
