// Normalize text for loose matching: Unicode-normalize, lowercase, strip pipes/apostrophes
export function norm(s) {
  return (s || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[|’']/g, '')
    .trim()
}

// Splits text into alternating word/separator tokens so punctuation and
// whitespace can be round-tripped unchanged in translated output.
const WORD_RE = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu

export function tokenize(text) {
  const tokens = []
  let last = 0
  for (const m of text.matchAll(WORD_RE)) {
    if (m.index > last) tokens.push({ type: 'sep', text: text.slice(last, m.index) })
    tokens.push({ type: 'word', text: m[0] })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ type: 'sep', text: text.slice(last) })
  return tokens
}
