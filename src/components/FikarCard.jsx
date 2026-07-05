// Renders one Finnish→Karelian entry: the Finnish headword and its Karelian
// equivalent(s) with inflection. Source: Markianova & Pyöli, suomi–karjala.
// Styled to match EntryCard: bold headword, plain-text gloss line below.
export default function FikarCard({ entry }) {
  return (
    <li className="entry">
      <div className="entry-head">
        <span className="headword">{entry.fi}</span>
      </div>
      <div className="entry-gloss">
        {entry.kar.map((k, i) => (
          <span key={i}>
            {i > 0 && ', '}
            {k.w}
            {k.i && <span className="infl"> ({k.i})</span>}
          </span>
        ))}
      </div>
    </li>
  )
}
