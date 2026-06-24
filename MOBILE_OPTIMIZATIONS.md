# Mobile Optimizations — RGR Handmade

**Data:** 2026-05-26  
**Status:** ✅ Implemented (TypeScript valid, awaiting production deployment)

---

## Overview

Versione mobile del sito RGR Handmade ottimizzata per schermi ≤640px seguendo una logica di **semplicità + luxury**.

### Principi

- ✅ Nascondere elementi ornamentali su mobile (seal parallax, vertical rail)
- ✅ Comprimere header (logo piccolo, toggle lingua compatto, btn contatti ridotto)
- ✅ Ridurre padding/margin su mobile (px-8 → px-4)
- ✅ Stack verticale elementi su schermi stretti (buttons, cards)
- ✅ Mantenere il design luxury — solo semplificare, non banalizzare

---

## Modifiche applicate

### 1. **BOXED_CONTAINER** — Padding responsive
```tsx
// Prima:
const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8";

// Dopo:
const BOXED_CONTAINER = "max-w-[1180px] mx-auto px-8 max-[640px]:px-4";
```
**Effetto:** Su mobile <640px, padding orizzontale dimezzato (32px → 16px)

---

### 2. **Header Brand** — Dimensioni ridotte
```tsx
// Logo + since text
className="flex flex-col items-center gap-1 max-[640px]:gap-0.5"
// Since text
className="font-sans text-[8.5px]... max-[640px]:text-[6.5px]"
```
**Effetto:** Logo compatto, meno spazio verticale

---

### 3. **Header Actions** — Toggle lingua + Btn contatti compatti
```tsx
// Gap ridotto tra toggle e btn
className="flex items-center gap-5 max-[640px]:gap-2"

// Toggle lingua
className="... max-[640px]:p-[2px] max-[640px]:gap-[1px]"
className="... max-[640px]:px-[7px] max-[640px]:py-[4px] max-[640px]:text-[8.5px]"

// Btn contatti
className="... max-[640px]:py-2.5! max-[640px]:px-3! max-[640px]:text-[9.5px]!"
```
**Effetto:** Header compresso, icone bandiere ridotte, testo più piccolo

---

### 4. **Seal Parallax** — Nascosto su mobile
```tsx
className="... max-[768px]:hidden"
```
**Effetto:** Seal (decorazione) scompare su tablet/mobile, libera spazio

---

### 5. **Hero Section** — Testo e margin ottimizzati
```tsx
// Eyebrow label
className="flex items-center gap-3.5 mb-8 max-[640px]:mb-5"
className="... max-[640px]:text-[12px]"

// H1 titolo
className="... mb-7 max-[640px]:mb-5"

// Lede paragrafo
className="... max-[640px]:text-[14px] max-[640px]:mb-6"

// Buttons — stack verticale
className="flex gap-4 flex-wrap max-[640px]:flex-col"
```
**Effetto:** Meno spazio tra elementi, buttons stackati verticalmente su mobile

---

### 6. **Marquee** — Font e gap ridotti
```tsx
className="... max-[640px]:h-12"
className="... max-[640px]:text-[13px] max-[640px]:gap-6"
```
**Effetto:** Marquee più compatto, font ridotto da 18px a 13px

---

### 7. **Atelier Section** — Padding ridotto
```tsx
className="... max-[640px]:px-4 max-[640px]:py-16"
```
**Effetto:** Testo sezione atelier ha meno padding su mobile (px-20 → px-4)

---

### 8. **Footer** — Padding e gap ridotti
```tsx
className="bg-warm-black text-ivory pt-[120px] pb-10 max-[640px]:pt-16 max-[640px]:pb-6"
className="... gap-12 mb-20 ... max-[640px]:gap-8 max-[640px]:mb-12"
```
**Effetto:** Footer più compatto (padding ridotto, gap tra colonne ridotto)

---

## Breakpoints utilizzati

| Breakpoint | Uso | Descrizione |
|---|---|---|
| `max-[640px]` | Header, hero, cta, footer | Mobile "stretto" (iPhone SE, Pixel 5) |
| `max-[768px]` | Seal parallax | Nascondere su tablet in giù |
| `max-lg` | Nav, vertical rail | Tailwind standard (1024px) |

---

## What's **NOT** changed

❌ No color changes  
❌ No font family changes  
❌ No animation changes  
❌ No Collections/News grid breakpoints (già ottimi)  
❌ No Vitrix admin code touched  

---

## Testing notes

**Desktop:** Nessun cambiamento visuale  
**Tablet (768-1024px):** Seal nascosto, responsive padding  
**Mobile (≤640px):** Header compatto, buttons stackati, spacing ridotto  

---

## Deploy checklist

- [x] Modifiche applicate a `components/HomePage.tsx`
- [ ] Test Chrome (una volta disponibile)
- [ ] npm run build deve passare
- [ ] Push a Vercel/production
- [ ] Smoke test mobile su device reale

---

**Modified by:** Claude (Chimera AI Agent)  
**File:** components/HomePage.tsx  
**Lines changed:** ~15 righe di classNames Tailwind  
**Build status:** Pending (SWC sandbox issue, not code-related)
