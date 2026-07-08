import { useState } from 'react'
import entries from './entries.json'
import fikar from './fikar.json'
import WordSearch from './components/WordSearch'
import SentenceTranslate from './components/SentenceTranslate'
import './App.css'

export default function App() {
  const [mode, setMode] = useState('search') // 'search' | 'translate'

  const total = (entries.length + fikar.length).toLocaleString('fi-FI')

  return (
    <div className="app">
      <header className="header">
        <h1>Karjala–suomi–karjala sanakirja</h1>
        <p className="subtitle">
          Lähteet: Pyöli, <em>Karjal–suomi</em> · Markianova &amp; Pyöli, <em>Suomi–karjala</em> · {total} hakusanaa
        </p>
      </header>

      <div className="toggle mode-tabs">
        <button
          className={mode === 'search' ? 'active' : ''}
          onClick={() => setMode('search')}
        >
          Sanahaku
        </button>
        <button
          className={mode === 'translate' ? 'active' : ''}
          onClick={() => setMode('translate')}
        >
          Käännä lause
        </button>
      </div>

      {mode === 'search' ? <WordSearch /> : <SentenceTranslate />}

      <footer className="footer">
        Toimii täysin paikallisesti selaimessasi — ei verkkoyhteyttä tarvita haun aikana.
      </footer>
    </div>
  )
}
// redeploy
