/**
 * Keyword screens that run before any model sees the text: on every line a
 * visitor types, and on custom scenario descriptions. They are the first of
 * the safety layers (the model classifier and the app-level stop come after),
 * so they lean toward catching too much on self-harm and toward precision
 * everywhere else, where a false stop only means "pick another scenario".
 *
 * The lists are a starting point for the clinical advisor's review (roadmap
 * D10), not a finished policy. Tests in screen.test.ts pin the intent: what
 * must stop, and the everyday idioms ("this deadline is killing me") that
 * must not.
 */

/** Why a custom scenario is refused. Mirrors `demoSafety.blocked.reasons` in content.ts. */
export type BlockReason = "romance" | "sexual" | "companion" | "minor" | "harm";

export type ScreenResult = { kind: "crisis" } | { kind: "blocked"; reason: BlockReason } | null;

/** Lowercase, straight apostrophes, single spaces, so one pattern covers "I’m", "I'm" and "Im". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Self-harm, suicide, intent to hurt someone, or being hurt right now. Idioms
 * about other people "killing" the user ("my mom will kill me") are left out on
 * purpose; "kill myself" is not.
 */
const CRISIS: readonly RegExp[] = [
  /\bsuicid(e|al)\b/,
  /\b(kill|killing|harm|harming)\s+my ?self\b/,
  // "I hurt myself at the gym" and "cut myself some slack" are everyday; intent or habit is not.
  /\b(want|wanna|going|gonna|plan|planning|thinking\s+(about|of)|thought\s+(about|of)|tempted|urge)\s+(to\s+)?(hurt|harm|cut|kill)\w*\s+my ?self\b/,
  /\b(been|keep|kept|started|start)\s+(cutting|hurting|harming)\s+my ?self\b/,
  /\bend(ing)?\s+it\s+all\b/,
  /\bkms\b/,
  /\bself[- ]?harm/,
  /\b(end|take|ending|taking)\s+my\s+(own\s+)?life\b/,
  // "I'm gonna die of embarrassment" is an idiom; wanting to die is not.
  /\b(want|wanna|ready|planning|plan)\s+(to\s+)?die\b/,
  /\bwish\s+i\s+(was|were)\s+dead\b/,
  /\bwish\s+i\s+(wasn't|was not|weren't|were not)\s+(alive|here|born)\b/,
  /\bbetter\s+off\s+(dead|without\s+me)\b/,
  /\b(no|not\s+any)\s+(reason|point)\s+(to|in)\s+(live|living|being\s+alive|going\s+on)\b/,
  /\bdon't\s+want\s+to\s+(live|be\s+alive|exist|be\s+here\s+anymore|wake\s+up)\b/,
  /\bcan't\s+(go\s+on|keep\s+going)\s+(anymore|like\s+this)\b/,
  /\boverdos(e|ed|ing)\b/,
  /\b(going|gonna|want|wanna|plan|planning)\s+to\s+(hurt|shoot|stab)\s+(him|her|them|someone|somebody|people|everyone|my)\b/,
  /\bshoot\s+up\s+(the|my|a)\b/,
  /\b(bring|brought|bringing)\s+a\s+(gun|knife|weapon)\s+to\b/,
  /\b(he|she|they)\s+(hits|beats|chokes|hurts)\s+me\b/,
  /\b(i'm|i am|im)\s+being\s+(abused|hurt)\b/,
  /\bnot\s+safe\s+at\s+home\b/,
];

/** The visitor's own lines: only a crisis stops a rehearsal. Rudeness, swearing and pushback are practice. */
export function screenTurn(text: string): ScreenResult {
  const t = normalize(text);
  return CRISIS.some((re) => re.test(t)) ? { kind: "crisis" } : null;
}

const BLOCKS: readonly { reason: BlockReason; patterns: readonly RegExp[] }[] = [
  {
    reason: "sexual",
    patterns: [
      /\b(have|having|had)\s+sex\b/,
      /\bsext(ing)?\b/,
      /\bnudes?\b/,
      /\bnaked\b/,
      /\bhorny\b/,
      /\bporn/,
      /\bhook(ing)?\s*up\s+with\b/,
      /\bmake\s+out\b/,
      /\bsleep(ing)?\s+with\s+(him|her|them|me|you)\b/,
      /\b(sexy|erotic|seduc\w*)\b/,
    ],
  },
  {
    // Rehearsing a breakup or a boundary with a partner is an everyday hard talk; playing a date is not.
    reason: "romance",
    patterns: [
      /\bask(ing)?\s+(him|her|them|someone|somebody|my\s+crush|a\s+(guy|girl))\s+out\b/,
      /\b(go|going|went)\s+on\s+a\s+date\b/,
      /\bfirst\s+date\b/,
      /\bmy\s+crush\b/,
      /\bflirt(ing|y)?\b/,
      /\bconfess(ing)?\s+(my\s+)?(feelings|love)\b/,
      /\b(be|pretend\s+to\s+be|act\s+like|play)\s+(my|a)\s+(girlfriend|boyfriend|gf|bf|partner|wife|husband|lover)\b/,
      /\b(kiss|kissing)\s+(him|her|them|me|you)\b/,
      /\bromantic\b/,
      /\bi\s+love\s+you\b/,
    ],
  },
  {
    reason: "companion",
    patterns: [
      /\bkeep\s+me\s+company\b/,
      /\b(be|pretend\s+to\s+be|act\s+like)\s+my\s+(friend|best\s+friend|bestie|companion|therapist)\b/,
      /\b(talk|chat)\s+(to|with)\s+me\s+(every\s+day|everyday|all\s+day|all\s+night|whenever)\b/,
      /\bi\s+just\s+(want|need)\s+someone\s+to\s+talk\s+to\b/,
    ],
  },
  {
    // The product is 18+. Someone else's age ("my 15 year old brother") is fine; the visitor's is not.
    reason: "minor",
    patterns: [
      /\b(i'm|i am|im)\s+(1[0-7]|thirteen|fourteen|fifteen|sixteen|seventeen)\b(?!\s*(minutes|hours|days|weeks|months|dollars|bucks|%))/,
      /\b(i'm|i am|im)\s+in\s+(middle\s+school|(6|7|8|9|10|11)(th)?\s+grade|(sixth|seventh|eighth|ninth|tenth|eleventh)\s+grade)\b/,
      /\b(i'm|i am|im)\s+a\s+(high\s+school\s+)?(freshman|sophomore|junior)\s+in\s+high\s+school\b/,
    ],
  },
  {
    reason: "harm",
    patterns: [
      /\b(threaten|threatening|blackmail|blackmailing|intimidate|intimidating|stalk|stalking|dox|doxx|doxing|doxxing)\s+(him|her|them|someone|somebody|my|a|the|people)\b/,
      /\b(scam|scamming|con|conning|phish|phishing)\s+(him|her|them|someone|somebody|my|people|an?\s+old)\b/,
      /\bpretend(ing)?\s+to\s+be\s+(from\s+)?(the\s+)?(bank|irs|police|cops|government|social\s+security|their\s+bank)\b/,
      /\bmake\s+(him|her|them)\s+(scared|afraid)\b/,
      /\bget\s+revenge\b/,
    ],
  },
];

/**
 * A custom scenario description. Crisis first (it gets the crisis card, not a
 * refusal), then the reasons a scenario is outside what the demo rehearses.
 */
export function screenScenario(text: string): ScreenResult {
  const t = normalize(text);
  if (CRISIS.some((re) => re.test(t))) return { kind: "crisis" };
  for (const block of BLOCKS) {
    if (block.patterns.some((re) => re.test(t))) return { kind: "blocked", reason: block.reason };
  }
  return null;
}
