import fikar from '../fikar.json'

// Authoritative Finnish→Karelian dictionary (Markianova & Pyöli, Sanakirja
// suomi–karjala). Replaces the old lossy reverse lookup that inverted the
// karjala→suomi glosses. Each entry: { id, fi, key, kar: [{ w, i }] }
// where `w` is the Karelian equivalent (keeps | inflection marker) and `i` its
// inflection string.
export const fikarEntries = fikar

// key -> entry, for fast single-word translation
export const fikarMap = new Map()
for (const e of fikarEntries) {
  if (!fikarMap.has(e.key)) fikarMap.set(e.key, e)
}

// Returns the primary Karelian equivalent (normalized, no | marker) for a
// Finnish word, or null. Used by the sentence translator.
export function lookupFinToKar(normedWord) {
  const e = fikarMap.get(normedWord)
  if (!e || !e.kar.length) return null
  return { text: e.kar[0].w.replace(/[|~]/g, ''), entry: e }
}
