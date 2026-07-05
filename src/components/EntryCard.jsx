// Renders one dictionary entry. When the entry has structured `senses`
// (parsed from the PDF), it shows each sense's gloss with its Karelian↔Finnish
// example sentences; otherwise it falls back to the flat gloss line.
export default function EntryCard({ entry }) {
  const senses = entry.senses
  const hasStructured =
    Array.isArray(senses) &&
    senses.length > 0 &&
    (senses.length > 1 || (senses[0].examples && senses[0].examples.length > 0))

  return (
    <li className="entry">
      <div className="entry-head">
        <span className="headword">{entry.head}</span>
        {entry.roman && <span className="roman">{entry.roman}</span>}
        {entry.infl && <span className="infl">({entry.infl})</span>}
      </div>

      {hasStructured ? (
        <ol className="sense-list">
          {senses.map((s, i) => (
            <li key={i} className="sense">
              {s.gloss && <span className="sense-gloss">{s.gloss}</span>}
              {s.examples && s.examples.length > 0 && (
                <ul className="example-list">
                  {s.examples.map((ex, j) => (
                    <li key={j} className="example">
                      <span className="example-kar">{ex.kar}</span>
                      <span className="example-fin">{ex.fin}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="entry-gloss">{entry.gloss}</div>
      )}

      <div className="entry-page">s. {entry.page}</div>
    </li>
  )
}
