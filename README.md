# 100x AI Labs — Next.js (Phase 2 scaffold)

This is the real framework the project spec doc (Section 4) recommends —
Next.js 15, App Router, TypeScript, Tailwind CSS. It replaces the
framework-free `100xailabs-website-phase1` folder as the base to build on
going forward. **It still only has the homepage** (same scope as Phase 1 —
REQ-002); everything else in the roadmap comes later.

## ⚠️ Not yet verified by a real build — please check this first

The sandbox this was built in has no access to the npm package registry
(an organization network policy), so `npm install` / `npm run build`
could not be run here to confirm this compiles cleanly. The code follows
standard Next.js 15 App Router conventions and mirrors the Phase 1 page's
logic closely, but you should run it once yourself before trusting it:

```bash
cd 100xailabs-web
npm install
npm run dev
```

Then open `http://localhost:3000`. If anything doesn't compile, paste the
error back and it'll get fixed immediately — treat this as an unverified
build until that first `npm install && npm run dev` succeeds.

## What's here

```
100xailabs-web/
├── app/
│   ├── layout.tsx      Root layout, metadata, Organization schema
│   ├── globals.css     Design tokens + the Phase 1 styling, adapted for Tailwind
│   └── page.tsx        The "/" route
├── components/
│   └── HeroVideo.tsx   Autoplay / Play / Replay logic (client component)
├── public/
│   ├── videos/hero-brand-video.mp4   Your video (see note below)
│   └── images/hero-poster.jpg
├── package.json, tsconfig.json, tailwind.config.ts, next.config.mjs, postcss.config.mjs
└── .eslintrc.json, .gitignore
```

## What changed vs. the static Phase 1 build

- Same visual result: white background, video at 50% of the viewport
  width/height, centered, Play/Replay button at the bottom-right corner
  of the video.
- The Play/Replay button is now **conditionally rendered** by React
  (mounted only when needed) instead of toggled with the HTML `hidden`
  attribute + CSS override. This is a more robust pattern than the static
  build's fix and avoids that whole class of bug by construction.
- Metadata, Open Graph tags and the Organization schema now live in
  `app/layout.tsx` using Next's typed `Metadata` API instead of raw
  `<meta>` tags.

## About the video

`public/videos/hero-brand-video.mp4` is the video you shared
(`Clean_robots_enter.mp4`) — you mentioned the finalized version is still
to come. When it's ready, just replace that file (same filename) and
regenerate the poster:

```bash
ffmpeg -ss 1 -i public/videos/hero-brand-video.mp4 -frames:v 1 -q:v 3 public/images/hero-poster.jpg
```

## Next steps (per the roadmap in the spec doc, Section 8)

Phase 2 continues from here with corporate pages, legal/policy pages and
a CMS; Phase 3 adds the configurable Domains/Products model. The static
`100xailabs-website-phase1` folder can be retired once this Next.js app
is confirmed working — keep it around only as a visual reference until
then.
