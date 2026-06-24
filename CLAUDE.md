# Regole progetto — RGR Handmade / Vitrix CMS

## Git workflow — REGOLA OBBLIGATORIA

**Tutti gli aggiornamenti vanno PRIMA su `develop`.**
Il merge/push su `main` e consentito solo dopo che il deploy di sviluppo e terminato
con successo ed e stato verificato. `main` rappresenta sempre la produzione.

```
modifica → commit/push su develop → deploy staging → verifica esito
solo se staging e riuscito → merge develop→main → push origin main → deploy produzione
```

- Non pushare mai direttamente su `main`.
- Non fare il merge su `main` mentre il deploy di `develop` e in corso, fallito o non verificabile.
- Se il deploy di sviluppo fallisce, correggere su `develop` e ripetere il ciclo.
- Netlify deploya automaticamente: `develop` → staging, `main` → produzione.

## Stack

- **Frontend sito**: Next.js 15, Tailwind v4, Framer Motion. Font: Cormorant Garamond + Manrope.
- **Backoffice Vitrix**: Material UI (MUI v9) esclusivo. Niente Tailwind nel pannello admin.
- **Database**: Supabase (PostgreSQL). Project ref: `mzxsbwoeupzctfrtaemd`.
- **Deploy**: Netlify.

## Dev server

`npm run dev` è sempre attivo sulla porta **3001**. Non eseguire `npm run build` senza chiedere.

## Architettura — due mondi separati

| Sito cliente (`/`) | Backoffice Vitrix (`/admin`) |
|--------------------|------------------------------|
| Tailwind + Framer Motion | MUI esclusivo |
| `components/` e `components/widgets/` | `components/admin/` |
| SSR + client hooks | Client-only con bootstrap Supabase |

Non mescolare i due mondi: niente MUI nel sito, niente Tailwind nel pannello admin.
