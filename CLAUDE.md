# CLAUDE.md — Agent Operating Instructions & Architecture Guide
# Project: LorcanaCountTracker (Disney Lorcana TCG Card & Deck Tracker)

This document configures **Claude (Claude Code, Claude Desktop, Claude Projects, and Cursor/Copilot)** to work seamlessly with the exact high standards, working style, and automated workflows of this repository.

---

## 🤖 Persona & Working Style Guidelines

1. **High Autonomy & Proactivity**:
   - Diagnose root causes before touching code; inspect files thoroughly.
   - When asked to implement or fix something, complete all necessary files end-to-end.
   - Never leave placeholder comments (`// TODO`, `/* implement later */`) in production code.
2. **Design Aesthetics & Craftsmanship**:
   - Maintain rich, premium UI/UX (dark-mode first, glassmorphism, gold/amber Lorcana accents `#dfc792` & `#c8b07b`, smooth micro-interactions).
   - Ensure responsive design down to small mobile viewports (360px–390px) with 0 horizontal overflow.
3. **Evidence Before Assertions**:
   - Never claim a task or test is passing without actually running the commands and verifying 0 errors.

---

## 🚀 Mandatory Operational Guardrails

### 1. Mandatory Version Bump & Git Tag on Deploy (CRITICAL)
Whenever merging to `main`, taking changes live, or deploying a release:
1. **Synchronize Version Numbers**:
   - Update `"version"` in [`package.json`](file:///Users/sadin/Project/LorcanaCountTracker/package.json) (SemVer format: `x.y.z`).
   - Update `APP_VERSION` in [`src/constants/version.ts`](file:///Users/sadin/Project/LorcanaCountTracker/src/constants/version.ts) to match exactly.
2. **Run Quality Gate Verification**:
   - Lint & Types: `npm run lint`
   - Production Build: `npm run build`
   - Playwright E2E Tests: `npx playwright test`
   - **Must achieve 100% pass (0 errors / 0 warnings)** before tagging.
3. **Git Tagging & Remote Push**:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z - <short description>"
   git push origin main --tags
   ```
4. **Append Release Entry in `AI_LOG.md`**.

---

### 2. Cross-Agent Action Log (`AI_LOG.md`)
Maintain [`AI_LOG.md`](file:///Users/sadin/Project/LorcanaCountTracker/AI_LOG.md) in the project root after every major modification:
```text
[YYYY-MM-DD HH:MM] LEVEL | AGENT | TOOL | description
```
- `LEVEL`: `Major` (writes, edits, bash commands, releases) or `Minor` (reads, searches)
- `AGENT`: `Claude` (or `Antigravity` / `Gemini`)
- `TOOL`: `Edit`, `Write`, `Command`, `Release`
- Always UTF-8, append-only, descriptions under 80 characters.

---

### 3. Cloud Sync & Firestore Guardrails
- **No Double-Underscore Document IDs**: Never use Firestore IDs like `__*__` (e.g. use `lorcana_decks_vault` instead of `__lorcana_decks__`).
- **Sanitize Undefined Values**: Firestore throws runtime errors on `undefined` fields. Always run `JSON.parse(JSON.stringify(payload))` or strip undefined keys before calling `setDoc` or `updateDoc`.
- **Dual Fallback Persistence**: Maintain fallback in user binder document (`/binders/lorcana_user_prices` or `/binders/lorcana_decks_vault`) if subcollections have permission restrictions.

---

### 4. UI & Responsive Rules
- **Mobile Viewport (< 640px)**: Header uses 2-row layout (`sm:hidden`). Row 1 has Logo, Badges, Profile, Install button; Row 2 has Cloud Sync & active context.
- **Language**: All UI labels, filter badges, toasts, and buttons must remain in English.

---

## 🛠️ Tech Stack & Key Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons & custom Lorcana SVG icons.
- **State Management**: Zustand Stores:
  - `useCollectionStore` (`src/store/collectionStore.ts`): Card binder counts, wishlists, profiles, search/filter state.
  - `usePricingStore` (`src/store/pricingStore.ts`): Market prices (USD base), PSA 10 estimates, last sold stats, recent transactions, multi-currency conversion (`THB`, `USD`, `EUR`, `GBP`, `JPY`), user cost/valuation.
  - `useAuthStore` (`src/store/authStore.ts`): Firebase Authentication & user profiles.
  - `useSyncStore` (`src/store/syncStore.ts`): Offline-first cloud synchronization & sync status.
  - `useDeckStore` (`src/store/deckStore.ts`): Deck builder, legal format checks, and live deck market valuations.
- **Testing**: Playwright (`e2e/*.spec.ts`) with dual Desktop & Mobile Chrome projects.
- **Static Assets**:
  - `public/data/market_prices.json` & `src/data/market_prices.json`: Bundled market pricing data for 3,100+ cards.
  - `scripts/fetch-lorcana-prices.mjs`: Node.js script to fetch live prices from Lorcast API.

---

## ⚡ Common Commands

```bash
# Start local development server
npm run dev

# Run Oxlint linter
npm run lint

# Compile TypeScript and build production bundle
npm run build

# Run Playwright E2E tests (Desktop & Mobile)
npx playwright test

# Run single Playwright test file
npx playwright test e2e/pricing.spec.ts

# Sync live card market prices
node scripts/fetch-lorcana-prices.mjs
```
