# Lorcana Collection Tracker

A collection tracker for the **Disney Lorcana** trading card game: track every card
you own across multiple binders, filter and search the full 3,192-card catalogue,
and sync to the cloud with a Google account.

Split out of [PokeCountTracker](https://github.com/sadin911/PokeCountTracker) so the
two games can evolve independently.

## Features (Phase 1)

- **Multiple binders** — independent named collections with their own icon.
- **Per-finish counts** — Lorcana prints in two finishes (normal and cold foil);
  Enchanted, Epic and Iconic cards are foil-only, and the catalogue states which
  finishes each card exists in, so no rarity guessing is needed.
- **Full catalogue** — 22 sets, 3,192 cards, sourced from the
  [Lorcast API](https://lorcast.com).
- **Filters** — set, ownership status, ink (dual-ink aware), card type, rarity,
  classification, plus sorting by number, name, ink cost, lore, strength or copies.
- **Fast search** — matches name, subtitle, collector number, set and classification.
- **Wishlist, condition and notes** per card.
- **Vivid mode** — unowned cards are desaturated by default; toggle to see every
  card in full colour.
- **Cloud sync** — Google sign-in, one Firestore document per binder. Works fully
  offline as a guest; local data is migrated up on first sign-in.
- **JSON backup** — export and re-import your whole collection.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind CSS v4 · Zustand 5 · Firebase 12.
Deployed to GitHub Pages; card images served from Cloudflare R2.

## Getting started

```bash
npm install
npm run data:cards     # fetch the catalogue into src/data/
npm run data:images    # download + convert card images into public/ (~300 MB)
npm run dev
```

`npm run data:images` is only needed for local development — in production the
images come from R2. Both image directories are gitignored.

### Environment

Copy `.env.example` to `.env.local` and fill it in:

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_*` | Firebase web app config. Without these, sign-in and cloud sync are disabled and the app runs in local-only guest mode. |
| `VITE_R2_CDN_BASE` | Public base URL of the R2 bucket holding card images. Leave blank to serve them from `public/`. |

`secret.yaml` (gitignored) holds the R2 side:

```yaml
AccessKey: ...
Secret: ...
S3Endpoint: https://<account>.r2.cloudflarestorage.com
Bucket: <bucket name>
```

> A `pub-*.r2.dev` URL is Cloudflare's rate-limited **development** endpoint.
> Attach a custom domain to the bucket before the site takes real traffic.

The same values must be set as GitHub Actions repository secrets for the Pages
deploy — `src/utils/firebase.ts` has no hardcoded fallbacks on purpose.

## Data pipeline

| Script | Does |
| --- | --- |
| `npm run data:cards` | Fetches every set and card from the Lorcast API into `src/data/lorcanaCards.json` (~1.75 MB) and `src/data/lorcanaSets.json`. Fails loudly if the card count, id uniqueness or JSON size gate is violated. |
| `npm run data:images` | Downloads each card's AVIF at Lorcast's maximum resolution and emits two WebP tiers: `public/card-images/` (320w, grid) and `public/card-images-lg/` (674w, detail view). Resumable — re-run to retry failures. |
| `npm run data:upload` | Uploads both tiers to Cloudflare R2, reading the endpoint, credentials and bucket name from a gitignored `secret.yaml` (override the bucket with `R2_BUCKET`). |

Card ids are `` `${setCode}-${collectorNumber}` `` verbatim — unique across all
3,192 cards. They are deliberately **not** zero-padded: set 8 ships both `1` and
`1f`, and padding after stripping non-digits would collide them. These ids are the
Firestore map keys, so they must never change.

Image URLs are derived from `setCode` + `collectorNumber` rather than stored per
card, which keeps the catalogue JSON small enough to import statically.

## Firestore

One document per binder at `users/{uid}/binders/{binderId}`. Rules live in
`firestore.rules`:

```bash
npm run rules:deploy    # prompts for a Google login the first time
```

The Firestore default for a new production-mode database denies everything,
including signed-in users — so cloud sync stays broken until these rules are
applied. You can also paste `firestore.rules` into Firebase Console → Firestore
Database → Rules → Publish.

Binder documents are written whole rather than merged, so cards you remove really
disappear from the cloud. The trade-off is that concurrent edits to the *same*
binder from two devices are last-write-wins.
