# Modulo LegalBlink CMP

Integrazione drop-in di Aruba LegalBlink per progetti Next.js App Router.
Nessuna dipendenza oltre Next e React.

## Trapianto su un nuovo progetto

1. Copia questa cartella in `components/legalblink/`, **escluso**
   `LegalDocumentPage.tsx`, che usa il design system di RGR e va riscritto.
2. Aggiungi le variabili d'ambiente:

   ```
   NEXT_PUBLIC_LEGALBLINK_LICENSE_ID=<license id del banner>
   NEXT_PUBLIC_LEGALBLINK_DOCUMENT_SET_ID=<id del set di documenti>
   ```

   Sono due identificativi **distinti**, entrambi pubblici: compaiono
   nell'HTML servito, quindi `NEXT_PUBLIC_` è corretto e non espone segreti.
   Senza `LICENSE_ID` il modulo resta inerte e non rende nulla — il progetto
   gira in locale e in CI senza credenziali Aruba.

3. Monta `<LegalBlinkProvider />` in `app/layout.tsx`, dentro `<body>`.
4. Aggiorna `DOCUMENT_SLUGS` in `config.ts` con gli slug del tuo account: li
   trovi nel pannello Aruba, voce **Integra**, nell'URL del documento.
5. Estendi la CSP (vedi sotto).
6. Usa `<ManageCookiesButton>` dove serve il link "aggiorna preferenze" e
   `<LegalBlinkPolicy>` dentro le rotte dei documenti.

## CSP

```
script-src  ... https://app.legalblink.it
frame-src   ... https://app.legalblink.it
connect-src ... https://app.legalblink.it
font-src    ... data:
```

`font-src data:` non è opzionale: il banner incorpora un woff2 come data URI.
Senza, il font viene rifiutato **in silenzio** e il banner ripiega su font di
sistema — nessun errore funzionale, solo un banner sbagliato.

## Cose da sapere sul CMP

Ricavate ispezionando `loader.js` e `banner.js` v1.0.2, non dalla
documentazione Aruba. Da riverificare a ogni nuova versione del CMP.

- Il loader va montato in `beforeInteractive`, non prima di `</body>` come dice
  la guida Aruba: con `blocking-mode="auto"` e i default del Consent Mode v2
  deve precedere ogni altro tag.
- ESLint segnala `no-before-interactive-script-outside-document`: la regola è
  scritta per il Pages Router e fa eccezione solo per `app/layout.tsx`. Il
  provider è disattivato sulla riga con una nota esplicativa.
- Non emettere mai `gtag('consent','default',...)`: li imposta LegalBlink
  tramite `data-consent-mode="true"`. Duplicarli crea una race condition.
- Il trigger delle preferenze è legato da una **scansione DOM one-shot** dentro
  un `useEffect` del CMP:

  ```js
  document.querySelectorAll('a[data-lb="c-settings"], button[data-lb="c-settings"], .lb-cs-settings-link')
  ```

  Un nodo rimontato da React resta inerte. Per questo `LegalBlinkProvider`
  tiene un anchor stabile nel layout e `ManageCookiesButton` gli inoltra il
  click, invece di portare `data-lb` di suo.
- Il banner è un web component (`<lb-cookie-banner>`, shadow DOM `open`)
  appeso a `document.body`: fuori dall'albero React, nessun conflitto di
  idratazione. Non espone `::part` né `exportparts`; l'unica variabile CSS
  pubblica è `--lb-color-primary`. La grafica si governa dal pannello Aruba.
- La posizione del banner e della floating icon viene da
  `banner.style.position`, che seleziona un foglio di stile diverso lato
  Aruba (`lb_cs.<position>.css`). Non è modificabile da codice.
- `window.__legalblink.listeners.addConsentListener(fn)` esiste ma non è
  documentato da Aruba: trattalo come API instabile.
- L'evento window `lbCloseBanner` chiude il banner.
- L'auto-blocking **si disattiva da sé** se rileva GTM
  (`"google_tag_manager" in window`), delegando tutto al Consent Mode.
- Gli slug dei documenti restano in italiano in ogni lingua: cambia solo il
  suffisso `-it` / `-en`. Uno slug tradotto risponde 404.
- `encodeURIComponent` lascia intatti `! ' ( ) *`: gli slug con apostrofo
  vanno codificati a mano, come fa `getDocumentUrl`.
- I documenti rispondono `frame-ancestors *`: l'embedding in iframe è
  consentito.
- Il backend non filtra per dominio: lo sviluppo su `localhost` funziona.

## Lato pannello Aruba

Il codice non basta. Nel pannello vanno verificati:

- **anagrafica del titolare** completa di ragione sociale, P. IVA, sede e
  recapiti — un'informativa senza dati di contatto non consente all'interessato
  di esercitare i propri diritti;
- **pulsante di rifiuto attivo** (`showRejectAllBtn`): il rifiuto deve essere
  immediato quanto l'accettazione;
- **URL della cookie policy** compilato in ogni lingua, altrimenti il banner
  cita un documento che non collega;
- **categorie di profilazione** attive solo se gli strumenti esistono davvero;
- **documenti generati in tutte le lingue** servite dal sito.

`config.ts` espone `DOCUMENTS_WITHOUT_EN` per i documenti non ancora tradotti:
ripiegano sull'italiano invece di servire un 404. Rimuovi la voce appena la
versione inglese esiste.
