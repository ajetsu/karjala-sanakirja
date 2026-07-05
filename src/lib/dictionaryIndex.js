import entries from '../entries.json'
import { norm, tokenize } from './text'

// Pre-normalize glosses once and attach quality signals used to pick the
// "best" entry when several entries collide on the same normalized key/word.
export const entriesWithGlossNorm = entries.map((e) => {
  const glossNorm = norm(e.gloss)
  // Strip inflection-boundary markers (same convention as `head`/`key`) before
  // tokenizing, so e.g. "mie|s" is treated as one word ("mies"), not split
  // into "mie" + "s" by the pipe.
  const glossWords = tokenize((e.gloss || '').replace(/[|’']/g, ''))
    .filter((t) => t.type === 'word')
    .map((t) => norm(t.text))
  return {
    ...e,
    glossNorm,
    glossWordCount: glossWords.length,
    glossWords,
    isEmptyGloss: !e.gloss || !e.gloss.trim(),
    startsWithKs: (e.gloss || '').trim().toLowerCase().startsWith('ks.'),
  }
})

// Shared tie-break: prefer non-empty gloss, then gloss that isn't a bare
// cross-reference ("ks. ..."), then the shorter (cleaner) gloss, else keep
// the first-seen entry (stable, matches the source dictionary's ordering).
function isBetterEntry(candidate, existing) {
  if (candidate.isEmptyGloss !== existing.isEmptyGloss) return existing.isEmptyGloss
  if (candidate.startsWithKs !== existing.startsWithKs) return existing.startsWithKs
  if (candidate.glossWordCount !== existing.glossWordCount) {
    return candidate.glossWordCount < existing.glossWordCount
  }
  return false
}

export const karIndex = new Map()
for (const e of entriesWithGlossNorm) {
  if (!e.key) continue
  const existing = karIndex.get(e.key)
  if (!existing || isBetterEntry(e, existing)) karIndex.set(e.key, e)
}

// Reverse index: every distinct word inside each entry's gloss maps back to
// that entry. A gloss that is exactly one word wins over one where the word
// only occurs incidentally inside a longer phrase/example sentence.
function isBetterReverseEntry(candidate, existing) {
  const candidateIsSingleWord = candidate.glossWordCount === 1
  const existingIsSingleWord = existing.glossWordCount === 1
  if (candidateIsSingleWord !== existingIsSingleWord) return candidateIsSingleWord
  return isBetterEntry(candidate, existing)
}

export const finIndex = new Map()
for (const e of entriesWithGlossNorm) {
  if (e.isEmptyGloss) continue
  const seen = new Set(e.glossWords)
  for (const w of seen) {
    if (w === 'ks' || w.length < 2) continue
    // Skip truncated fragments left by the PDF extraction (e.g. gloss "en-"
    // for "ensimmäinen") so they don't hijack short reverse-lookup keys.
    if (e.glossNorm.includes(w + '-')) continue
    const existing = finIndex.get(w)
    if (!existing || isBetterReverseEntry(e, existing)) finIndex.set(w, e)
  }
}
