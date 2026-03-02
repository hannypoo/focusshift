export const COMPLETION_AFFIRMATIONS = [
  "Crushed it!",
  "One step closer.",
  "That's momentum right there.",
  "Look at you go!",
  "Solid work.",
  "You showed up. That's what matters.",
  "Progress, not perfection.",
  "Brain: focused. Task: done.",
  "Another one in the books.",
  "You're on a roll!",
  "Future you says thanks.",
  "Consistency is your superpower.",
  "Small wins stack up.",
  "That took real focus. Well done.",
  "You chose to show up. That's huge.",
];

export const RETURN_MESSAGES = [
  "Welcome back! Here's your updated plan.",
  "You're back! Let's pick up where we left off.",
  "Life happens. Let's get back on track.",
  "No worries about the pause. Here's what's next.",
  "Ready when you are. Here's the updated schedule.",
];

export const SON_TIME_NUDGES = [
  "It's been a few days since Son Time. Maybe a quick FaceTime call?",
  "Your son would love to hear from you. Consider scheduling some time today.",
  "Son Time has been low this week. Even 15 minutes makes a difference.",
  "Hey — don't forget the most important person. Schedule some son time?",
];

export function getRandomAffirmation(): string {
  return COMPLETION_AFFIRMATIONS[Math.floor(Math.random() * COMPLETION_AFFIRMATIONS.length)];
}

export function getRandomReturnMessage(): string {
  return RETURN_MESSAGES[Math.floor(Math.random() * RETURN_MESSAGES.length)];
}

export function getRandomSonTimeNudge(): string {
  return SON_TIME_NUDGES[Math.floor(Math.random() * SON_TIME_NUDGES.length)];
}

export const HARD_TASK_AFFIRMATIONS = [
  "That was a tough one. You absolutely crushed it.",
  "Hard task? Done. Your brain showed up today.",
  "That took serious willpower. Be proud.",
  "You tackled the hard thing first. Legend.",
  "The hardest part is starting. You did it all.",
  "Your future self is doing a happy dance right now.",
  "That was peak performance. Take a breath.",
  "Hard mode: conquered.",
];

export const STREAK_AFFIRMATIONS = [
  "Day {streak}! You're building something real.",
  "{streak} days strong. Consistency is your superpower.",
  "That's {streak} days in a row. Unstoppable.",
  "{streak}-day streak! Your brain is learning new patterns.",
  "Day {streak}. Every day you show up, it gets a little easier.",
];

export function getHardTaskAffirmation(): string {
  return HARD_TASK_AFFIRMATIONS[Math.floor(Math.random() * HARD_TASK_AFFIRMATIONS.length)];
}

export function getStreakAffirmation(streak: number): string {
  const template = STREAK_AFFIRMATIONS[Math.floor(Math.random() * STREAK_AFFIRMATIONS.length)];
  return template.replace(/{streak}/g, String(streak));
}
