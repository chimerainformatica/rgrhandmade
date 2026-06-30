---
name: rafaello-nextjs
description: Use Rafaello for Next.js technical audits and fixes focused on contact email reliability, SMTP/provider deliverability, Google indexing safety, robots, sitemap, canonical, noindex, metadata, Core Web Vitals, and minimal public-form security.
---

# Rafaello - Next.js Email, SEO Google Safety e Performance

Use this skill when the task involves a Next.js marketing, lead generation, or B2B site and the work touches email forms, deliverability, Google crawl/indexing safety, technical SEO, performance, or public-form security.

## Operating Rules

- Read the local project before editing: `package.json`, router folders, `next.config.ts`, `middleware.ts`, layout/metadata files, robots/sitemap files, contact form components, API routes/server actions, `.env.example`, and `CLAUDE.md` if present.
- Complete and report an initial audit before modifying files.
- Respect local project rules. In this repository, do not run `npm run build` unless the user explicitly asks.
- Prefer `npm run lint` and `npx tsc --noEmit` for non-build validation when available.
- Keep public site and Vitrix admin boundaries separate: Tailwind/Framer Motion for the public site, MUI only for admin.
- Preserve existing design and copy unless a technical SEO, accessibility, security, or reliability issue requires a narrow change.
- Do not introduce heavy libraries when the project already has a reasonable local solution.
- Never expose or log secrets.

## Audit Checklist

Report these before edits:

1. Next.js, React, and TypeScript versions from `package.json`.
2. Router in use: App Router, Pages Router, or both.
3. Hosting/config present: Vercel, Docker, Netlify, Nginx, Cloudflare, or other.
4. Available commands: build, lint, typecheck, test.
5. Where layouts, main pages, metadata, sitemap, and robots are defined.
6. Where contact forms, API endpoints, server actions, or route handlers are defined.
7. Email provider or mechanism: nodemailer/SMTP, Resend, SendGrid, Postmark, AWS SES, PHP mail, or other.
8. Required `.env` variables for email, analytics, site URL, and Google verification.
9. Code that can block Google: `noindex`, restrictive robots, wrong canonicals, redirects, middleware, or auth on public pages.
10. Quality and risk level of images, fonts, analytics scripts, client components, and animations.

Classify findings:
- P1: blocks email, build, crawl, indexing, canonical, or Google safety.
- P2: reduces SEO, performance, conversion, or stability.
- P3: useful improvement, not urgent.

## Email Rules

- Validate required fields server-side.
- Sanitize CR, LF, and null bytes where values can reach email headers.
- Enforce length limits for name, email, phone, company, and message.
- Validate email and phone server-side.
- Use honeypot and, when present, minimum-fill-time checks.
- Return a real frontend error when email delivery fails.
- Log enough server-side context to diagnose failures, without unnecessary personal data or secrets.
- Provide text and HTML email bodies compatible with Gmail and Outlook.
- Document required environment variables.

Critical deliverability rule:
- Do not use the visitor email as envelope sender.
- Use an authenticated technical address for `from`, `sender`, and `envelope.from`.
- Put the visitor email in `replyTo`.
- Configure recipients from environment variables such as `CONTACT_TO` and `CONTACT_CC`.

## SEO and Google Safety Rules

- Ensure `metadataBase` or equivalent base URL is correct.
- Use page-specific title and description for important public pages.
- Keep canonical URLs absolute and aligned with the public production domain.
- Provide valid Open Graph and Twitter metadata.
- Ensure `robots.txt` or `app/robots.ts` does not block public pages or required assets.
- Ensure `sitemap.xml` or `app/sitemap.ts` includes important public pages and does not use localhost/staging URLs.
- Remove accidental `noindex` from marketing pages.
- Use JSON-LD only when appropriate and truthful; FAQPage only if FAQ content is visible.
- Keep one visible H1 per page and coherent H2/H3 structure.
- Ensure meaningful alt text on informative images.
- Check middleware/auth does not intercept public pages.
- Keep important SEO content renderable in initial HTML rather than client-only after interaction.

## Performance Rules

- Use `next/image` with known dimensions and correct `sizes` for relevant images.
- Use `priority` only for true above-the-fold LCP images.
- Prefer WebP/AVIF or optimized assets where possible.
- Use `next/font` with `display: swap` and minimal families/weights.
- Reduce unnecessary `"use client"`.
- Lazy-load heavy video, animation, carousel, map, chart, or admin-only code.
- Load analytics with non-blocking strategy.
- Watch CLS from images, video, and fonts without stable dimensions.

## Security Rules

- Add or preserve sensible headers where compatible: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or CSP `frame-ancestors`.
- Keep server-side validation mandatory.
- Do not accept unlimited form payloads.
- Do not use permissive CORS unless justified.

## Final Response

End with:
- summary of changes;
- files modified;
- P1/P2/P3 issues resolved;
- tests run and results;
- tests skipped and reason;
- required `.env` variables;
- residual risks;
- recommended Italian commit message in present tense.
