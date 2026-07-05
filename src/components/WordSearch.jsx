import { useState, useMemo, useRef, useEffect } from 'react'
import { norm } from '../lib/text'
import { entriesWithGlossNorm } from '../lib/dictionaryIndex'
import { fikarEntries } from '../lib/fikarIndex'
import EntryCard from './EntryCard'
import FikarCard from './FikarCard'

const PAGE_SIZE = 60
// Below this length, substring ("contains") matching is skipped — with 11k+/20k+
// headwords, a 1-2 letter query buried-in-a-longer-word search is mostly noise
// (measured: ~200-350 extra hits at 2 chars, dropping to ~20-55 at 3).
const MIN_CONTAINS_LENGTH = 3

export default function WordSearch() {
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState('kar2fin') // 'kar2fin' | 'fin2kar'
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const inputRef = useRef(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, direction])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const q = norm(query)

  const results = useMemo(() => {
    if (!q) return []
    let matches
    const allowContains = q.length >= MIN_CONTAINS_LENGTH
    if (direction === 'kar2fin') {
      const starts = []
      const contains = []
      for (const e of entriesWithGlossNorm) {
        if (e.key.startsWith(q)) starts.push(e)
        else if (allowContains && e.key.includes(q)) contains.push(e)
      }
      starts.sort((a, b) => a.key.length - b.key.length)
      contains.sort((a, b) => a.key.length - b.key.length)
      matches = [...starts, ...contains]
    } else {
      // Suomi → karjala: use the authoritative fi→kar dictionary.
      const starts = []
      const contains = []
      for (const e of fikarEntries) {
        if (e.key.startsWith(q)) starts.push(e)
        else if (allowContains && e.key.includes(q)) contains.push(e)
      }
      starts.sort((a, b) => a.key.length - b.key.length)
      contains.sort((a, b) => a.key.length - b.key.length)
      matches = [...starts, ...contains]
    }
    return matches
  }, [q, direction])

  const shown = results.slice(0, visibleCount)

  return (
    <>
      <div className="controls">
        <div className="toggle">
          <button
            className={direction === 'kar2fin' ? 'active' : ''}
            onClick={() => setDirection('kar2fin')}
          >
            Karjala → suomi
          </button>
          <button
            className={direction === 'fin2kar' ? 'active' : ''}
            onClick={() => setDirection('fin2kar')}
          >
            Suomi → karjala
          </button>
        </div>

        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder={
            direction === 'kar2fin'
              ? 'Hae karjalankielistä sanaa… esim. hengi, elädä, aiga'
              : 'Hae suomenkielistä sanaa… esim. henki, elää, aika'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      <main className="results">
        {!q && (
          <div className="empty-state">
            Kirjoita hakusana yllä olevaan kenttään.
          </div>
        )}

        {q && results.length === 0 && (
          <div className="empty-state">Ei osumia haulle "{query}".</div>
        )}

        {q && results.length > 0 && (
          <>
            <div className="result-count">
              {results.length.toLocaleString('fi-FI')} osumaa
            </div>
            <ul className="entry-list">
              {shown.map((e) =>
                direction === 'kar2fin' ? (
                  <EntryCard key={e.id} entry={e} />
                ) : (
                  <FikarCard key={e.id} entry={e} />
                )
              )}
            </ul>
            {visibleCount < results.length && (
              <button
                className="load-more"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Näytä lisää ({results.length - visibleCount} jäljellä)
              </button>
            )}
          </>
        )}
      </main>
    </>
  )
}
