// Helper for Browser Speech Recognition and Voice Answer Matching

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// Normalize strings for speech comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Intelligent matcher that matches spoken audio transcripts to quiz choices.
 * Handles option letters ("Option A", "A", "First choice"), numbers ("1", "one"),
 * semantic affirmative/negative ("True", "False", "Yes", "No", "Sahi", "Galat"),
 * and fuzzy substring token overlap.
 */
export function matchSpokenTextToOption(
  spokenText: string,
  options: string[]
): { matchedOption: string; matchedIndex: number; confidence: 'high' | 'medium' | 'low' } | null {
  if (!spokenText || !options || options.length === 0) return null;

  const spoken = normalizeText(spokenText);
  if (!spoken) return null;

  // 1. Check for explicit Letter references: "Option A", "Choice A", "Letter B", "A", "B", "C", "D"
  const letterMap: Record<string, number> = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    'option a': 0,
    'option b': 1,
    'option c': 2,
    'option d': 3,
    'choice a': 0,
    'choice b': 1,
    'choice c': 2,
    'choice d': 3,
    first: 0,
    'first one': 0,
    'first option': 0,
    second: 1,
    'second one': 1,
    'second option': 1,
    third: 2,
    'third one': 2,
    'third option': 2,
    fourth: 3,
    'fourth one': 3,
    'fourth option': 3,
    one: 0,
    two: 1,
    three: 2,
    four: 3,
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    pehla: 0,
    doosra: 1,
    teesra: 2,
    chautha: 3,
  };

  // Exact letter/choice match
  for (const [key, idx] of Object.entries(letterMap)) {
    if (spoken === key || spoken.startsWith(key + ' ') || spoken.endsWith(' ' + key)) {
      if (idx < options.length) {
        return { matchedOption: options[idx], matchedIndex: idx, confidence: 'high' };
      }
    }
  }

  // 2. Check for True / False equivalents
  const isTrueOption = options.some((opt) => opt.toLowerCase() === 'true');
  const isFalseOption = options.some((opt) => opt.toLowerCase() === 'false');
  if (isTrueOption && isFalseOption) {
    const trueWords = ['true', 'yes', 'correct', 'right', 'haan', 'sahi', 'ha', 'yep', 'yeah'];
    const falseWords = ['false', 'no', 'incorrect', 'wrong', 'nahin', 'nahi', 'galat', 'na', 'nope'];

    if (trueWords.some((w) => spoken.includes(w))) {
      const trueIdx = options.findIndex((opt) => opt.toLowerCase() === 'true');
      return { matchedOption: options[trueIdx], matchedIndex: trueIdx, confidence: 'high' };
    }
    if (falseWords.some((w) => spoken.includes(w))) {
      const falseIdx = options.findIndex((opt) => opt.toLowerCase() === 'false');
      return { matchedOption: options[falseIdx], matchedIndex: falseIdx, confidence: 'high' };
    }
  }

  // 3. Exact full match or containment
  for (let i = 0; i < options.length; i++) {
    const optNorm = normalizeText(options[i]);
    if (!optNorm) continue;
    if (spoken === optNorm || spoken.includes(optNorm) || optNorm.includes(spoken)) {
      return { matchedOption: options[i], matchedIndex: i, confidence: 'high' };
    }
  }

  // 4. Token Overlap matching
  const spokenTokens = spoken.split(/\s+/).filter((t) => t.length > 2);
  let bestMatchIndex = -1;
  let maxOverlap = 0;

  options.forEach((option, idx) => {
    const optTokens = normalizeText(option).split(/\s+/).filter((t) => t.length > 2);
    let overlapCount = 0;
    spokenTokens.forEach((token) => {
      if (optTokens.some((ot) => ot.includes(token) || token.includes(ot))) {
        overlapCount++;
      }
    });
    if (overlapCount > maxOverlap) {
      maxOverlap = overlapCount;
      bestMatchIndex = idx;
    }
  });

  if (bestMatchIndex !== -1 && maxOverlap > 0) {
    return {
      matchedOption: options[bestMatchIndex],
      matchedIndex: bestMatchIndex,
      confidence: maxOverlap >= 2 ? 'high' : 'medium',
    };
  }

  return null;
}
