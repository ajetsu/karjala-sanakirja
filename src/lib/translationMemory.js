import { entriesWithGlossNorm } from './dictionaryIndex'
import gastroExamples from './gastroExamples.json'
import { norm, tokenize } from './text'

// Translation memory: reuses the dictionary's own verified {kar, fin} example
// sentence pairs (from entries.json senses, plus the small gastro-vocabulary
// pool) as an example-based lookup, instead of training/fine-tuning a neural
// model — the corpus (a few thousand pairs) is far too small for real NMT.
// This is a quality boost for input that closely matches a known example; it
// intentionally stays silent for the common case of genuinely novel input.

function stripTrailingPunct(s) {
  return s.replace(/[.!?]+$/, '').trim()
}

function wordSet(text) {
  return new Set(
    tokenize(text)
      .filter((t) => t.type === 'word')
      .map((t) => norm(t.text))
  )
}

function buildPair(kar, fin) {
  return {
    kar,
    fin,
    karNorm: norm(stripTrailingPunct(kar)),
    finNorm: norm(stripTrailingPunct(fin)),
    karWords: wordSet(kar),
    finWords: wordSet(fin),
  }
}

const pairs = []
for (const e of entriesWithGlossNorm) {
  for (const sense of e.senses || []) {
    for (const ex of sense.examples || []) {
      if (ex.kar && ex.fin) pairs.push(buildPair(ex.kar, ex.fin))
    }
  }
}
for (const ex of gastroExamples) {
  if (ex.kar && ex.fin) pairs.push(buildPair(ex.kar, ex.fin))
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const w of a) if (b.has(w)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

// Conservative on purpose: a false positive (surfacing an unrelated example as
// a "verified" translation) is worse than a false negative (staying silent),
// since this is a rare quality boost layered on top of the always-on
// word-by-word translator, not the primary translation path.
export const TM_JACCARD_THRESHOLD = 0.7
const MIN_WORDS_FOR_FUZZY = 3

export function findTranslationMemoryMatch(inputText, direction) {
  const inputNorm = norm(stripTrailingPunct(inputText))
  if (!inputNorm) return null
  const sourceKey = direction === 'kar2fin' ? 'karNorm' : 'finNorm'
  const sourceWordsKey = direction === 'kar2fin' ? 'karWords' : 'finWords'

  // Tier 1: exact normalized whole-sentence match.
  for (const pair of pairs) {
    if (pair[sourceKey] === inputNorm) return { pair, tier: 'exact' }
  }

  // Tier 2: Jaccard word-overlap fallback, guarded against tiny inputs where
  // overlap ratios are noisy (one shared word out of two already gives 0.5).
  const inputWords = wordSet(inputText)
  if (inputWords.size < MIN_WORDS_FOR_FUZZY) return null

  let best = null
  let bestScore = 0
  for (const pair of pairs) {
    const score = jaccard(inputWords, pair[sourceWordsKey])
    if (score > bestScore) {
      bestScore = score
      best = pair
    }
  }
  if (best && bestScore >= TM_JACCARD_THRESHOLD) return { pair: best, tier: 'fuzzy' }
  return null
}
