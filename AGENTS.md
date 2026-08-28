# Cross-Agent Repository Rules & Guidelines

This document applies to **all AI coding assistants** working on this repository, including **Antigravity IDE, Claude Code, Gemini CLI, GitHub Copilot, and Cursor**.

---

## 1. Mandatory Version Bump & Git Tag on Deploy (CRITICAL)

Whenever taking changes live, merging to `main`, or triggering a production deployment:

1. **Synchronize Version Numbers**:
   - Update `"version"` in [`package.json`](file:///Users/sadin/Project/LorcanaCountTracker/package.json) (SemVer: `x.y.z`).
   - Update `APP_VERSION` in [`src/constants/version.ts`](file:///Users/sadin/Project/LorcanaCountTracker/src/constants/version.ts) to match exactly.
2. **Quality Gate Verification Before Tagging**:
   - Run linter and typecheck: `npm run lint`
   - Run production build: `npm run build`
   - Run E2E tests: `npx playwright test`
   - Ensure all tests pass with 0 errors before tagging.
3. **Git Tagging & Push**:
   - Create an annotated git tag matching the version format `vX.Y.Z`:
     ```bash
     git tag -a vX.Y.Z -m "Release vX.Y.Z - <short description>"
     ```
   - Push both commits and tags to remote:
     ```bash
     git push origin main --tags
     ```
4. **Log in AI_LOG.md**:
   - Record the release with level `Major` and action `Release | vX.Y.Z - <summary>`.

---

## 2. Shared Action Log (`AI_LOG.md`)

Every agent MUST maintain [`AI_LOG.md`](file:///Users/sadin/Project/LorcanaCountTracker/AI_LOG.md) in the project root.

### Format
```text
[YYYY-MM-DD HH:MM] LEVEL | AGENT | TOOL | description
```

### Classification
- `Major` — file writes, edits, terminal commands, releases, session end
- `Minor` — reads, searches, lookups, navigation

### Rules
- Location: `<project-root>/AI_LOG.md`
- One line per action, UTF-8, append-only (never overwrite or truncate)
- Keep descriptions concise (under 80 characters)
- Log every Major action immediately after it completes

---

## 3. UI & Responsive Design Rules

- **Mobile Viewports (< 640px)**:
  - Header MUST use a clean 2-row layout (`sm:hidden`) to avoid button overlap on small screens (e.g. 360px–390px).
  - Row 1: Logo, Tracker/Deck badge, OTA status, PWA Install button (when `!isInstalled`), Profile picker, Sign In / Profile.
  - Row 2: Versioned Cloud Sync badge + active Binder/Deck context.
  - PWA Install button (`📲 Install`) MUST remain accessible on both mobile and desktop whenever the app is not running in standalone mode.
- **English Language**: All UI labels, filter badges, toasts, and buttons must be in English.

---

## 4. Cloud Sync & Firestore Guardrails

- **Reserved Document IDs**: Never use Firestore document IDs starting and ending with double underscores `__.*__` (e.g. do NOT use `__lorcana_decks__`; use `lorcana_decks_vault`).
- **Sanitize Undefined Values**: Firestore throws errors on `undefined` fields. Always strip `undefined` keys before writing to Firestore.
- **Dual Fallback Sync**: In case user subcollection permissions (`/decks`) are restricted, maintain fallback persistence in the user's binder document (`/binders/lorcana_decks_vault`).
