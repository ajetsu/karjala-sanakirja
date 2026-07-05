# Karjala–suomi–karjala sanakirja

Paikallisesti pyörivä hakusovellus, joka on rakennettu Pertti Pyölin
karjala–suomi-sanakirja-PDF:n pohjalta (n. 10 000 hakusanaa, sivut 18–463).

## Käyttöönotto

Vaatii Node.js:n (14+ riittää, mikä tahansa uudehko versio toimii).

```bash
npm install
npm run dev
```

Terminaali näyttää osoitteen (yleensä `http://localhost:5173`) — avaa se selaimessa.
Kaikki data on paketissa mukana `src/entries.json`-tiedostossa, joten sovellus
toimii täysin ilman verkkoyhteyttä haun jälkeen.

## Tuotantoversio (valinnainen)

```bash
npm run build
npm run preview
```

`npm run build` tuottaa staattisen version `dist`-kansioon, jonka voi avata
miltä tahansa paikalliselta web-palvelimelta.

## Datan laadusta

Sanakirjan sisältö on poimittu automaattisesti PDF:n tekstikerroksesta
(pdfplumber + oma jäsennyslogiikka). Valtaosa n. 10 000 hakusanasta on
jäsentynyt siististi (hakusana, taivutus, suomennos), mutta pieni osa
merkinnöistä (arviolta muutama prosentti) voi olla katkonaisia sivun-
vaihtokohdissa tapahtuneiden jäsennysvirheiden vuoksi. Jos jokin sana ei
löydy, kannattaa kokeilla lyhyempää hakusanan alkuosaa.

## Rakenne

- `src/entries.json` — jäsennelty sanakirja-aineisto
- `src/App.jsx` — hakulogiikka (karjala→suomi ja suomi→karjala, alku- ja
  osamerkkijonohaku)
- `src/App.css` — ulkoasu
