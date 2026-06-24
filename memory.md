# RGR Handmade / Vitrix - Project Memory

## Stack and Architecture
- Public frontend: Next.js 15, React 19, Tailwind v4, Framer Motion.
- Admin Vitrix: Material UI only, under `components/admin`.
- Public site components live in `components`, `components/ui`, and `components/widgets`.
- Keep public frontend and admin styling separate: no MUI in the public site, no Tailwind in admin.
- Fonts are local via `next/font/local`: Cormorant Garamond and Manrope in `app/fonts`.

## Workflow
- Work, commit, and push first on `develop`.
- Wait for the development/staging deploy to complete successfully and verify it.
- Only after successful staging verification, merge `develop` into `main` and push `main`.
- Treat `main` as production. Never push changes directly to `main`.
- If staging fails or cannot be verified, do not merge to `main`; fix it on `develop` and redeploy.
- Do not run `npm run build` unless the user explicitly asks.
- The user usually runs `npm run dev` and manual build checks from their terminal.
- Safe validation commands: `npx tsc --noEmit`, `npm run lint` when it does not rewrite files.

## SEO and Performance Decisions
- Canonical URL must never be empty; fallback is `site.url`.
- Robots default is index/follow unless Vitrix settings explicitly disable it.
- Keep hero/about text available immediately for SEO and first render.
- Non-critical frontend sections can be code-split with `next/dynamic`: mobile menu, manifesto, collection widget, WhatsApp FAB.
- Hero video should use poster and lightweight preload to reduce mobile startup cost.
- Public links should include descriptive `title` attributes for SEO audit compatibility.
- Avoid mojibake in visible copy; replace corrupted sequences before editing text.

## VTX Collection
- Public widget is `VTX Collection`, technical id `vtx_collection`.
- Keep fallback compatibility with legacy `ctx_collections`.
- Frontend collection cards open a local preview modal; they do not navigate to external collection pages.
- Use skeletons for initial load and tab changes, and `FrontendLoader` only for preview click/loading.
- Thumbnail images must use lighter render URLs; preview images use higher resolution render URLs.

## Recent Frontend Notes
- `FooterContactForm` owns the boxed footer contact module with image and mailto form.
- `ScrollTextLinesSection` renders the RGR manifesto motion section; keep it compact and not tilted.
- `FrontendLoader` is gold for public frontend use and should not render a surrounding background card.
- `WhatsAppFab` is a public floating action button and should remain dynamically loaded.
