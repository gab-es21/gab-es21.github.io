# gab-es21.github.io

Gabriel Esteves' personal portfolio — a scroll-driven, Apple-style walkthrough of his education and project timeline, built as a fully static Next.js site.

Live at **[gab-es21.github.io](https://gab-es21.github.io)**.

## Stack

- **Next.js** (App Router, TypeScript) with `output: 'export'` — fully static, no server
- **GSAP + ScrollTrigger** (`@gsap/react`'s `useGSAP` hook) for scroll-driven pin/scrub/reveal animation
- **Tailwind CSS v4** for layout and utility styling
- Deployed via **GitHub Actions** to GitHub Pages on every push to `main`

## Structure

```
src/
  app/            # root layout, page composition, global styles
  components/
    sections/     # Hero, About, EducationTimeline, ProjectShowcase, ProjectGrid, Skills, Contact
    motion/       # GSAP setup + reusable FadeInReveal / PinnedPanel wrappers
    ui/           # small presentational pieces (icons, tags, headings)
  data/           # timeline.ts (single source of truth for education + projects), site.ts, skills.ts
  lib/types.ts    # TimelineEntry data model
```

`data/timeline.ts` is the only place project/education content lives — sections map over it rather than hardcoding per-entry JSX.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build & preview the static export

```bash
npm run build    # outputs to ./out
npx serve out    # preview the actual static output, not the dev server
```

## Deploy

Push to `main` — `.github/workflows/deploy.yml` builds and publishes automatically. One-time repo setting required: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
