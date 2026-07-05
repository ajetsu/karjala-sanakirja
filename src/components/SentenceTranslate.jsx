import { useMemo, useState } from 'react'
import { norm, tokenize } from '../lib/text'
import { karIndex, finIndex } from '../lib/dictionaryIndex'
import { lookupVerbForm } from '../lib/verbForms'
import { lookupFinToKar } from '../lib/fikarIndex'
import { findTranslationMemoryMatch } from '../lib/translationMemory'
import EntryCard from './EntryCard'
import FikarCard from './FikarCard'

// Ordered longest-first so e.g. "-ssa" is tried before "-a".
const FALLBACK_SUFFIXES = ['ssa', 'ssä', 'sta', 'stä', 'lla', 'llä', 'lta', 'ltä', 'n', 'a', 'ä', 'i', 't']
const MIN_STEM_LENGTH = 3

function tryFuzzyMatch(normedWord, index) {
  for (const suffix of FALLBACK_SUFFIXES) {
    if (!normedWord.endsWith(suffix)) continue
    const stem = normedWord.slice(0, normedWord.length - suffix.length)
    if (stem.length < MIN_STEM_LENGTH) continue
    const entry = index.get(stem)
    if (entry) return entry
  }
  return null
}

function cleanHead(head) {
  return (head || '').replace(/[|’']/g, '')
}

function applyCase(originalWord, translation) {
  if (!translation) return translation
  const isAllUpper = originalWord.length > 1 && originalWord === originalWord.toUpperCase()
  if (isAllUpper) return translation.toUpperCase()
  const firstIsUpper = originalWord[0] && originalWord[0] === originalWord[0].toUpperCase() && originalWord[0] !== originalWord[0].toLowerCase()
  if (firstIsUpper) return translation.charAt(0).toUpperCase() + translation.slice(1)
  return translation
}

function translateWord(word, direction) {
  const index = direction === 'kar2fin' ? karIndex : finIndex
  const normed = norm(word)

  // Curated common-verb / pronoun forms take precedence: these are the
  // inflected forms (e.g. "olen", "menet") the base-form dictionary can't match.
  const verbForm = lookupVerbForm(normed, direction)
  if (verbForm) {
    // No breakdown card: these come from the curated table, not the dictionary,
    // so index.get() would attach an arbitrary/garbage entry (e.g. "en").
    return { text: applyCase(word, verbForm), confidence: 'verb', entry: null }
  }

  // Suomi → karjala: prefer the authoritative fi→kar dictionary over the
  // lossy inverted-gloss lookup.
  if (direction === 'fin2kar') {
    const fk = lookupFinToKar(normed)
    if (fk) return { text: applyCase(word, fk.text), confidence: 'exact', entry: fk.entry }
  }

  let entry = index.get(normed)
  let confidence = 'exact'
  if (!entry) {
    entry = tryFuzzyMatch(normed, index)
    confidence = entry ? 'fuzzy' : 'none'
  }
  if (!entry) return { text: word, confidence: 'none', entry: null }
  const rawTranslation = direction === 'kar2fin' ? entry.gloss : cleanHead(entry.head)
  return { text: applyCase(word, rawTranslation), confidence, entry }
}

// Extension point for a future async/remote translation provider (e.g. an
// LLM API): a remote path would implement the same (text, direction) ->
// {tokens, outputText, breakdown} contract, likely async, and could be
// selected here without touching the rest of this component.
function translateSentence(text, direction) {
  const tokens = tokenize(text).map((t) => {
    if (t.type !== 'word') return { ...t, result: null }
    return { ...t, result: translateWord(t.text, direction) }
  })

  const outputText = tokens.map((t) => (t.type === 'word' ? t.result.text : t.text)).join('')

  const seen = new Set()
  const breakdown = []
  for (const t of tokens) {
    if (t.type !== 'word' || !t.result.entry) continue
    const entry = t.result.entry
    // fikar entries (fi→kar) and entries.json entries (kar→fin) both start
    // ids at 0, so the dedupe key must include which dataset it came from.
    const dedupeKey = (entry.fi !== undefined ? 'fikar:' : 'kar:') + entry.id
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    breakdown.push(entry)
  }

  return { tokens, outputText, breakdown }
}

const PLACEHOLDERS = {
  kar2fin: 'Kirjoita lause karjalaksi… esim. Mie olen kodih mänemäš.',
  fin2kar: 'Kirjoita lause suomeksi… esim. Minä olen menossa kotiin.',
}

const LABELS = {
  kar2fin: ['Karjala', 'Suomi'],
  fin2kar: ['Suomi', 'Karjala'],
}

export default function SentenceTranslate() {
  const [sourceText, setSourceText] = useState('')
  const [direction, setDirection] = useState('kar2fin')

  const { tokens, outputText, breakdown } = useMemo(
    () => translateSentence(sourceText, direction),
    [sourceText, direction]
  )

  // Separate, additive check against the same input — does not affect the
  // word-by-word tokens/outputText/breakdown above in any way.
  const tmMatch = useMemo(
    () => (sourceText.trim() ? findTranslationMemoryMatch(sourceText, direction) : null),
    [sourceText, direction]
  )

  const [sourceLabel, targetLabel] = LABELS[direction]

  function handleSwap() {
    setDirection((d) => (d === 'kar2fin' ? 'fin2kar' : 'kar2fin'))
    setSourceText(outputText)
  }

  return (
    <>
      <div className="translate-toolbar">
        <span className="translate-pane-label">{sourceLabel}</span>
        <button className="translate-swap" onClick={handleSwap} title="Vaihda suunta" aria-label="Vaihda suunta">
          ⇄
        </button>
        <span className="translate-pane-label">{targetLabel}</span>
      </div>

      <div className="translate-panes">
        <div className="translate-pane">
          <textarea
            className="translate-textarea"
            placeholder={PLACEHOLDERS[direction]}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="translate-pane">
          <div className="translate-output">
            {!sourceText && <span className="empty-state">Käännös näkyy tässä.</span>}
            {tokens.map((t, i) =>
              t.type === 'sep' ? (
                <span key={i}>{t.text}</span>
              ) : (
                <span
                  key={i}
                  className={
                    t.result.confidence === 'fuzzy'
                      ? 'fuzzy-token'
                      : t.result.confidence === 'none'
                      ? 'untranslated-token'
                      : undefined
                  }
                  title={
                    t.result.confidence === 'fuzzy'
                      ? 'Arvioitu vastine (sanan taivutusmuoto)'
                      : t.result.confidence === 'none'
                      ? 'Ei löytynyt sanakirjasta'
                      : undefined
                  }
                >
                  {t.result.text}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {tmMatch && (
        <div className="tm-match">
          <div className="tm-match-title">
            {tmMatch.tier === 'exact'
              ? 'Sanakirjasta löytyi sama esimerkkilause'
              : 'Sanakirjasta löytyi hyvin samankaltainen esimerkkilause'}
          </div>
          <div className="tm-match-kar">{tmMatch.pair.kar}</div>
          <div className="tm-match-fin">{tmMatch.pair.fin}</div>
        </div>
      )}

      {breakdown.length > 0 && (
        <div className="word-breakdown">
          <div className="word-breakdown-title">Sana sanalta</div>
          <ul className="entry-list">
            {breakdown.map((e) =>
              e.fi !== undefined ? (
                <FikarCard key={'fikar:' + e.id} entry={e} />
              ) : (
                <EntryCard key={'kar:' + e.id} entry={e} />
              )
            )}
          </ul>
        </div>
      )}
    </>
  )
}
