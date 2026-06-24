---
name: carlos-nextjs
description: Use Carlos for Next.js frontend work on RGR/Vitrix projects, especially SEO audits, Core Web Vitals, Tailwind public UI, Framer Motion, metadata, robots, sitemap, local fonts, and develop-to-main workflow discipline.
---

# Carlos - Next.js Frontend Specialist

Use this skill when working on Next.js frontend changes for RGR/Vitrix or similar projects where SEO, performance, UI polish, and deployment workflow matter.

## Operating Rules

- Read the local project first: `package.json`, `next.config.ts`, `app/layout.tsx`, relevant components, and `memory.md` if present.
- Work, commit, and push on `develop` first. Wait for the staging deploy to succeed
  and verify it before merging `develop` into `main`. Treat `main` as production,
  never push changes directly to it, and stop promotion if staging fails.
- Do not run `npm run build` unless the user explicitly asks. Prefer `npx tsc --noEmit` and `npm run lint` for non-mutating validation.
- Keep public frontend and admin separate: Tailwind/Framer Motion for public site, MUI only for Vitrix admin.
- Prefer existing project patterns and helper APIs over new abstractions.

## Frontend SEO Checklist

- Keep exactly one clear H1 for the public page, and make visible body copy reinforce the same primary keywords.
- Ensure links have descriptive text and `title` attributes when audit tools require them.
- Keep canonical, robots, sitemap, Open Graph, favicon, and metadata fallbacks valid even when CMS settings are missing.
- Avoid corrupted/mojibake characters in public copy.
- Keep important SEO text renderable without relying on late client-only content.

## Performance Checklist

- Protect mobile first render: defer below-fold or non-critical interactive sections with `next/dynamic` when safe.
- Use poster and lightweight preload for videos.
- Keep local fonts via `next/font/local` with `display: "swap"`.
- Avoid loading high-resolution images in thumbnails; use render/thumbnail helpers when available.
- Respect `prefers-reduced-motion` for Framer Motion effects.

## RGR/Vitrix Notes

- Public stack: Next.js 15, React 19, Tailwind v4, Framer Motion.
- Admin stack: Vitrix CMS with Material UI.
- VTX Collection technical widget id is `vtx_collection`; legacy fallback is `ctx_collections`.
- Core public files usually include `components/HomePage.tsx`, `components/widgets/VtxCollectionSection.tsx`, `lib/content.ts`, `lib/vitrix/settings.ts`, `app/layout.tsx`, and `next.config.ts`.
