import { norm } from './text'

// Curated conjugation table for the most common verbs, to patch the biggest
// weakness of the word-by-word translator: inflected verb forms (especially
// "olla") never match the dictionary's base-form headwords.
//
// Source: Raija Pyöli, Sanakirja karjala–suomi (2021). The dictionary lists
// present 1sg/3sg/3pl for every verb; those are attested here. 2sg/1pl/2pl
// follow the regular Livvi present pattern (spot-checked against the corpus:
// olet, oletto, menet, tulet, otan, ottau all occur verbatim in the source).
// Each row aligns Finnish forms with their Livvi-Karelian equivalents by index.
//
// Order of forms: [infinitive, 1sg, 2sg, 3sg, 1pl, 2pl, 3pl]
// (olla additionally carries its past tense, since it is by far the most common.)

const VERBS = [
  {
    fi: ['olla', 'olen', 'olet', 'on', 'olemme', 'olette', 'ovat'],
    kar: ['olla', 'olen', 'olet', 'on', 'olemmo', 'oletto', 'ollah'],
  },
  {
    // olla, past tense
    fi: ['olin', 'olit', 'oli', 'olimme', 'olitte', 'olivat'],
    kar: ['olin', 'olit', 'oli', 'olimmo', 'olitto', 'oldih'],
  },
  {
    fi: ['tulla', 'tulen', 'tulet', 'tulee', 'tulemme', 'tulette', 'tulevat'],
    kar: ['tulla', 'tulen', 'tulet', 'tulou', 'tulemmo', 'tuletto', 'tullah'],
  },
  {
    fi: ['mennä', 'menen', 'menet', 'menee', 'menemme', 'menette', 'menevät'],
    kar: ['mennä', 'menen', 'menet', 'menöü', 'menemmö', 'menettö', 'mennäh'],
  },
  {
    fi: ['saada', 'saan', 'saat', 'saa', 'saamme', 'saatte', 'saavat'],
    kar: ['suaha', 'suan', 'suat', 'suau', 'suammo', 'suatto', 'suahah'],
  },
  {
    fi: ['antaa', 'annan', 'annat', 'antaa', 'annamme', 'annatte', 'antavat'],
    kar: ['andua', 'annan', 'annat', 'andau', 'annammo', 'annatto', 'annetah'],
  },
  {
    fi: ['ottaa', 'otan', 'otat', 'ottaa', 'otamme', 'otatte', 'ottavat'],
    kar: ['ottua', 'otan', 'otat', 'ottau', 'otammo', 'otatto', 'otetah'],
  },
  {
    fi: ['tehdä', 'teen', 'teet', 'tekee', 'teemme', 'teette', 'tekevät'],
    kar: ['azuo', 'azun', 'azut', 'azuu', 'azummo', 'azutto', 'azutah'],
  },
  {
    fi: ['nähdä', 'näen', 'näet', 'näkee', 'näemme', 'näette', 'näkevät'],
    kar: ['nähtä', 'näin', 'näit', 'nägöü', 'näemmö', 'näettö', 'nähtäh'],
  },
  {
    fi: ['tietää', 'tiedän', 'tiedät', 'tietää', 'tiedämme', 'tiedätte', 'tietävät'],
    kar: ['tiediä', 'tiijän', 'tiijät', 'tiedäü', 'tiijämmö', 'tiijättö', 'tietäh'],
  },
  {
    fi: ['ajatella', 'ajattelen', 'ajattelet', 'ajattelee', 'ajattelemme', 'ajattelette', 'ajattelevat'],
    kar: ['ajatella', 'ajattelen', 'ajattelet', 'ajattelou', 'ajattelemmo', 'ajatteletto', 'ajatellah'],
  },
  {
    fi: ['ymmärtää', 'ymmärrän', 'ymmärrät', 'ymmärtää', 'ymmärrämme', 'ymmärrätte', 'ymmärtävät'],
    kar: ['ellendiä', 'ellendän', 'ellendät', 'ellendäü', 'ellendämmö', 'ellendättö', 'ellendetäh'],
  },
  {
    fi: ['muistaa', 'muistan', 'muistat', 'muistaa', 'muistamme', 'muistatte', 'muistavat'],
    kar: ['mustua', 'mustan', 'mustat', 'mustau', 'mustammo', 'mustatto', 'mustetah'],
  },
  {
    fi: ['sanoa', 'sanon', 'sanot', 'sanoo', 'sanomme', 'sanotte', 'sanovat'],
    kar: ['sanuo', 'sanon', 'sanot', 'sanou', 'sanommo', 'sanotto', 'santah'],
  },
  {
    fi: ['puhua', 'puhun', 'puhut', 'puhuu', 'puhumme', 'puhutte', 'puhuvat'],
    kar: ['paista', 'pagizen', 'pagizet', 'pagizou', 'pagizemmo', 'pagizetto', 'paistah'],
  },
  {
    fi: ['kysyä', 'kysyn', 'kysyt', 'kysyy', 'kysymme', 'kysytte', 'kysyvät'],
    kar: ['küzüö', 'küzün', 'küzüt', 'küzüü', 'küzümmö', 'küzüttö', 'küzütäh'],
  },
  {
    fi: ['vastata', 'vastaan', 'vastaat', 'vastaa', 'vastaamme', 'vastaatte', 'vastaavat'],
    kar: ['vastata', 'vastuan', 'vastuat', 'vastuau', 'vastuammo', 'vastuatto', 'vastatah'],
  },
  {
    fi: ['voida', 'voin', 'voit', 'voi', 'voimme', 'voitte', 'voivat'],
    kar: ['voija', 'voin', 'voit', 'voi', 'voimmo', 'voitto', 'voijah'],
  },
  {
    fi: ['haluta', 'haluan', 'haluat', 'haluaa', 'haluamme', 'haluatte', 'haluavat'],
    kar: ['tahtuo', 'tahton', 'tahtot', 'tahtou', 'tahtommo', 'tahtotto', 'tahtotah'],
  },
  {
    fi: ['osata', 'osaan', 'osaat', 'osaa', 'osaamme', 'osaatte', 'osaavat'],
    kar: ['maltua', 'maltan', 'maltat', 'maltau', 'maltammo', 'maltatto', 'maltetah'],
  },
  {
    // impersonal necessity: "(minun) pitää / täytyy" -> "pidäü"
    fi: ['pitää', 'täytyy'],
    kar: ['pidäü', 'pidäü'],
  },
  {
    // personal pronouns — needed so "minä olen" etc. translate as a unit
    fi: ['minä', 'sinä', 'hän', 'me', 'te', 'he'],
    kar: ['minä', 'sinä', 'häi', 'müö', 'tüö', 'hüö'],
  },
  {
    // negation verb (kieltoverbi). The dictionary lists it explicitly:
    // "ei (kieltoverbi) en, et, ei, emmo, etto, ei".
    fi: ['en', 'et', 'ei', 'emme', 'ette', 'eivät'],
    kar: ['en', 'et', 'ei', 'emmo', 'etto', 'ei'],
  },
  {
    // negative imperative — same "auxiliary + connegative" pattern as negation.
    // Dictionary: "älgiä älkää", "älgäh älköön". 2sg "älä" + connegative already
    // works (älä ole, älä anna); this adds the 2pl/3sg governing forms.
    fi: ['älä', 'älkää', 'älköön'],
    kar: ['älä', 'älgiä', 'älgäh'],
  },
  {
    // Plural imperative connegative (-kO forms after älkää): "älkää menkö" =>
    // "älgiä mengiä". Karelian forms attested in the source dictionaries
    // (mengiä, tulgua, olgua; -kkua pattern for many verbs).
    fi: ['menkö', 'tulko', 'olko', 'ottako', 'antako', 'sanoko', 'tehkö', 'katsoko', 'pelätkö'],
    kar: ['mengiä', 'tulgua', 'olgua', 'ottakkua', 'annakkua', 'sanokkua', 'azukkua', 'kačokkua', 'varaitakkua'],
  },
  {
    // Connegative forms — the verb form used after negation ("en tiedä" =>
    // "en tiijä"). Finnish connegative -> Livvi connegative. Attested in the
    // corpus: en ole, en tiijä, ei mene, en voi, en musta, en tahto, en malta,
    // en ellendä, en näi/näe, en sano. (Some collide with 3sg present forms,
    // e.g. "saa"/"voi"/"vastaa" — the present form wins, which is close enough.)
    fi: ['ole', 'tiedä', 'mene', 'tule', 'ota', 'anna', 'näe', 'muista', 'halua', 'tahdo', 'osaa', 'ymmärrä', 'sano', 'puhu', 'kysy', 'tee', 'ajattele'],
    kar: ['ole', 'tiijä', 'mene', 'tule', 'ota', 'anna', 'näi', 'musta', 'tahto', 'tahto', 'malta', 'ellendä', 'sano', 'pagize', 'küzü', 'azu', 'ajattele'],
  },
]

// Build direction-specific lookup maps. First writer wins, so the primary
// table above (present tense of common verbs) takes precedence over any later
// incidental collisions.
const fi2kar = new Map()
const kar2fin = new Map()
for (const { fi, kar } of VERBS) {
  const n = Math.min(fi.length, kar.length)
  for (let i = 0; i < n; i++) {
    const fk = norm(fi[i])
    const kk = norm(kar[i])
    if (fk && !fi2kar.has(fk)) fi2kar.set(fk, kar[i])
    if (kk && !kar2fin.has(kk)) kar2fin.set(kk, fi[i])
  }
}

// Returns a curated translation for a common verb/pronoun form, or null.
export function lookupVerbForm(normedWord, direction) {
  const map = direction === 'kar2fin' ? kar2fin : fi2kar
  return map.get(normedWord) || null
}
