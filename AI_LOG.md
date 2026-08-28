[2026-08-27 02:22] Major | Antigravity | Write | AI_LOG.md - init log
[2026-08-27 02:22] Major | Antigravity | Bash | npm run dev (http://localhost:5174/LorcanaCountTracker/)
[2026-08-27 02:26] Major | Antigravity | Bash | git merge & tag v0.1.0
[2026-08-27 02:26] Major | Antigravity | Bash | git push origin main & tag v0.1.0
[2026-08-27 02:47] Major | Antigravity | Bash | git checkout -b feat/lorcana-ui-theme-overhaul
[2026-08-27 02:35] Major | Antigravity | Command | git checkout -b feat/lorcana-ui-theme-overhaul
[2026-08-27 02:45] Major | Antigravity | Edit | src/index.css, src/constants/lorcana.ts - Disney Lorcana starlight theme
[2026-08-27 02:50] Major | Antigravity | Edit | src/components/collection/* - Clean minimal toolbar, modal, and ink UI
[2026-08-27 02:51] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 02:55] Major | Antigravity | Edit | src/components - fixed dropdown z-index layer stacking over card grid
[2026-08-27 02:56] Major | Antigravity | Edit | src/components/collection/CollectionTracker.tsx - sort Disney Series A-Z
[2026-08-27 02:59] Major | Antigravity | Edit | src/components - responsive card zoom density (Compact / Normal / Large)
[2026-08-27 03:01] Major | Antigravity | Edit | src/components - add custom column input & stepper (1-12 columns)
[2026-08-27 03:09] Major | Antigravity | Edit | Theme color overhaul to match official Disney Lorcana palette & gold styling
[2026-08-27 03:09] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:12] Major | Antigravity | Edit | Add Ink Cost (1-9+) & Inkwell (Inkable/Uninkable) filters
[2026-08-27 03:15] Major | Antigravity | Edit | Header official Lorcana logo & Mobile/Tablet touch UX targets
[2026-08-27 03:15] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:18] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - No horizontal scroll, minimal symbols
[2026-08-27 03:18] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:20] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - Exposed Sort By on toolbar
[2026-08-27 03:20] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:20] Major | Antigravity | Command | git push origin feat/lorcana-ui-theme-overhaul
[2026-08-27 03:25] Major | Antigravity | Write | src/components/icons/LorcanaIcons.tsx - official Lorcana SVG icons suite
[2026-08-27 03:25] Major | Antigravity | Edit | src/components/collection/* - integrate Lorcana Inks, Inkwell, Lore, Stats, Rarity
[2026-08-27 03:25] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:25] Major | Antigravity | Command | git push origin feat/lorcana-ui-theme-overhaul
[2026-08-27 03:28] Major | Antigravity | Write | public/robots.txt, public/sitemap.xml, public/manifest.json - SEO suite
[2026-08-27 03:28] Major | Antigravity | Edit | index.html, CollectionTracker.tsx - meta, OpenGraph, JSON-LD, H1 SEO
[2026-08-27 03:28] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:28] Major | Antigravity | Command | git push origin feat/lorcana-ui-theme-overhaul
[2026-08-27 03:30] Major | Antigravity | Command | git checkout -b feat/admin-analytics-dashboard
[2026-08-27 03:45] Major | Antigravity | Write | src/utils/adminAuth.ts, src/components/admin/* - OAuth Admin Console
[2026-08-27 03:48] Major | Antigravity | Command | git reset --soft ce6263e - squash & sanitize history
[2026-08-27 03:48] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 03:48] Major | Antigravity | Command | git push --force-with-lease origin feat/admin-analytics-dashboard
[2026-08-27 03:50] Major | Antigravity | Edit | package.json - bump version to 0.2.0
[2026-08-27 03:50] Major | Antigravity | Command | git checkout main && git merge feat/admin-analytics-dashboard
[2026-08-27 03:50] Major | Antigravity | Command | git tag -a v0.2.0 && git push origin main --tags - release published
[2026-08-27 03:52] Major | Antigravity | Edit | .github/workflows/deploy.yml - add enablement to configure-pages
[2026-08-27 03:52] Major | Antigravity | Command | git push origin main
[2026-08-27 04:03] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - expose Rarity filter capsule on Row 2
[2026-08-27 04:03] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 04:03] Major | Antigravity | Command | git tag -a v0.2.1 && git push origin main --tags - release published
[2026-08-27 04:05] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - display full text Rarity names
[2026-08-27 04:05] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 04:05] Major | Antigravity | Command | git tag -a v0.2.2 && git push origin main --tags - release published
[2026-08-27 04:07] Major | Antigravity | Edit | .github/workflows/deploy.yml - configure Node 22 & suppress deprecation warning
[2026-08-27 04:07] Major | Antigravity | Command | git push origin main
[2026-08-27 04:10] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - responsive mobile Rarity
[2026-08-27 04:10] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 04:10] Major | Antigravity | Command | git tag -a v0.2.3 && git push origin main --tags - release published
[2026-08-27 10:49] Major | Antigravity | Write | public/CNAME - set custom domain lore.tcgcount.com
[2026-08-27 10:49] Major | Antigravity | Edit | vite.config.ts, public/404.html, sitemap.xml, robots.txt, index.html - domain
[2026-08-27 10:49] Major | Antigravity | Command | npm run build - verification passed
[2026-08-27 10:49] Major | Antigravity | Command | git push origin main - custom domain lore.tcgcount.com
[2026-08-27 11:29] Major | Antigravity | Write | public/sw.js, src/hooks/usePWAInstall.ts, src/components/common/PWAInstallModal.tsx - PWA suite
[2026-08-27 11:29] Major | Antigravity | Edit | src/components/collection/CollectionHeader.tsx, manifest.json, main.tsx, index.html - Install PWA
[2026-08-27 11:29] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 11:59] Major | Antigravity | Edit | src/components/collection/CollectionHeader.tsx, CollectionFilterBar.tsx - fix z-index stacking
[2026-08-27 11:59] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 12:59] Major | Antigravity | Write | src/hooks/usePullToRefresh.ts, src/components/common/PullToRefreshIndicator.tsx - PTR
[2026-08-27 12:59] Major | Antigravity | Edit | index.html, index.css, CollectionHeader.tsx, CollectionTracker.tsx, AdminPage.tsx, Modals - safe-area
[2026-08-27 12:59] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 13:02] Major | Antigravity | Edit | src/components/collection/CollectionFilterBar.tsx - fix mobile action toolbar wrapping
[2026-08-27 13:02] Major | Antigravity | Command | npm run lint && npm run build - verification passed
[2026-08-27 13:19] Major | Claude | Command | git checkout -b feat/booster-pack-preview
[2026-08-27 13:19] Major | Claude | Edit | src/components/collection/BoosterPackPreviewModal.tsx - drop framer-motion (uninstalled dep broke tsc), use project animate-fade-in
[2026-08-27 13:19] Major | Claude | Edit | src/components/collection/CollectionGridView.tsx - booster thumbnail trigger on the set progress bar
[2026-08-27 13:19] Major | Claude | Edit | package.json, scripts/upload-lorcana-r2.mjs - add data:boosters script, upload public/set-boosters to R2
[2026-08-27 13:19] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 13:25] Major | Claude | Edit | scripts/upload-lorcana-r2.mjs - accept dir filters so one directory can be uploaded alone
[2026-08-27 13:25] Major | Claude | Command | npm run data:upload -- set-boosters - 22 booster covers live on R2 (verified 22/22 HTTP 200)
[2026-08-27 13:32] Major | Claude | Edit | scripts/download-set-boosters.mjs, src/data/setBoosterImages.json - keep booster art for the 13 numbered sets only; promo/special sets have no retail pack and their URLs pointed at unrelated products (7 shipped byte-identical art)
[2026-08-27 13:32] Major | Claude | Command | git rm public/set-boosters/{P1,P2,P3,cp,C2,D23,DIS,Coconut,PD1}.webp - wrong art removed
[2026-08-27 13:32] Major | Claude | Edit | src/data/catalogue.ts, CollectionTracker.tsx - SETS_NEWEST_FIRST: set filter lists newest release first (card sorting still uses SET_ORDER ascending)
[2026-08-27 13:32] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 14:00] Major | Claude | Command | git checkout -b feat/premium-rarity-shimmer
[2026-08-27 14:00] Major | Claude | Edit | src/index.css - foil-sheen utility: slow specular glint + soft-light iridescence, frozen under prefers-reduced-motion
[2026-08-27 14:00] Major | Claude | Edit | src/constants/lorcana.ts - isPremiumRarity (Enchanted/Epic/Iconic) + foilSheenDelay FNV-1a stagger
[2026-08-27 14:00] Major | Claude | Edit | CollectionCardItem.tsx, CardCollectionModal.tsx - sheen on premium cards only, and only when rendered in colour
[2026-08-27 14:00] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 14:11] Major | Claude | Write | src/hooks/useFoilTilt.ts - pointer-tracked 3D tilt, writes CSS vars (no React state per pointermove)
[2026-08-27 14:11] Major | Claude | Edit | src/index.css - foil-3d + foil-sheen + foil-holo: perspective tilt, cursor-tracked specular, color-dodge holo bands with parallax
[2026-08-27 14:11] Major | Claude | Edit | CollectionCardItem.tsx, CardCollectionModal.tsx - tilt handlers + holo layer on premium cards
[2026-08-27 14:11] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 14:39] Major | Claude | Edit | src/hooks/useFoilTilt.ts - gyroscope tilt (opt-in per call site), baseline calibration, screen-orientation remap, iOS permission gesture
[2026-08-27 14:39] Major | Claude | Edit | src/index.css - drop the cursor-following specular spot; keep tilt + sweeping reflection only
[2026-08-27 14:39] Major | Claude | Edit | CardCollectionModal.tsx - gyro enabled here only, plus the iOS enable button
[2026-08-27 14:39] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 14:45] Major | Claude | Edit | src/index.css - remove every time-driven foil layer (sweeping glint, holo idle pulse); light is now purely a function of tilt
[2026-08-27 14:45] Major | Claude | Edit | constants/lorcana.ts, CollectionCardItem.tsx, CardCollectionModal.tsx - drop foilSheenDelay and the foil-sheen layer
[2026-08-27 14:45] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 14:59] Major | Antigravity | Commit | Lorcana booster pack preview integration and SetSelect thumbnails
[2026-08-27 15:03] Major | Antigravity | Fix | Resolved mobile touch event scroll lock and optimized pull-to-refresh
[2026-08-27 15:05] Major | Claude | Edit | src/components/collection/CollectionFilterBar.tsx - mobile filter layout: Set+Series share a row, capsules grow to fill, duplicate Rarity/Cost/Inkwell moved to the drawer on phones
[2026-08-27 15:05] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:12] Major | Claude | Edit | CollectionFilterBar.tsx - phone: Rarity back in the bar, grid density moved into the Filters drawer
[2026-08-27 15:12] Major | Claude | Edit | src/hooks/useFoilTilt.ts - gyro tilt driven by rotation between readings with a per-frame decay to flat, replacing absolute-angle-from-baseline
[2026-08-27 15:12] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:16] Major | Claude | Edit | src/hooks/useFoilTilt.ts - isotropic dead zone on gyro movement (0.45°/reading) and faster decay (0.88 -> 0.82)
[2026-08-27 15:16] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:18] Major | Antigravity | Fix | Disabled auto-focus on dropdown open to prevent keyboard popup
[2026-08-27 15:21] Major | Claude | Edit | src/components/common/SearchableSetSelect.tsx - focus the search field only when the list was opened with a mouse, so a tap no longer summons the keyboard
[2026-08-27 15:21] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:24] Major | Antigravity | Fix | Fixed dropdown z-index stacking above card grid in PokeCountTracker
[2026-08-27 15:34] Major | Claude | Edit | src/index.css - idle glint restored alongside the tilt-tracked holo; shallower rotation, lighter shadow
[2026-08-27 15:34] Major | Claude | Edit | src/hooks/useFoilTilt.ts - MAX_TILT_DEG 7 -> 3.5
[2026-08-27 15:34] Major | Claude | Edit | constants/lorcana.ts, CollectionCardItem.tsx, CardCollectionModal.tsx - foilSheenDelay back, stagger set on the foil layers themselves
[2026-08-27 15:34] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:36] Major | Claude | Edit | src/index.css - remove the sweeping glint layer entirely (foil-glint keyframes + foil-sheen utility)
[2026-08-27 15:36] Major | Claude | Edit | constants/lorcana.ts, CollectionCardItem.tsx, CardCollectionModal.tsx - foilSheenDelay renamed foilPulseDelay, staggers the holo pulse over its 9s cycle
[2026-08-27 15:36] Major | Claude | Command | npm run lint && npm run build - verification passed
[2026-08-27 15:45] Major | Claude | Edit | src/hooks/useFoilTilt.ts - gyro back to absolute angle from a captured baseline; no impulse, no decay, no spring-back to level
[2026-08-27 15:45] Major | Claude | Command | npm run build - compiles clean (browser verification skipped at the user's request)
[2026-08-27 15:51] Major | Claude | Edit | src/hooks/useFoilTilt.ts - widen tilt range (3.5->7deg, gain 0.35->0.4), move the low-pass filter and the DOM write onto animation frames, drop the CSS transition on gyro writes
[2026-08-27 15:51] Major | Claude | Command | npm run build - compiles clean (browser verification skipped at the user's request)
[2026-08-27 16:00] Major | Claude | Write | src/hooks/useScrollLock.ts - reference-counted page scroll lock for overlays, exposes data-overlay-open
[2026-08-27 16:00] Major | Claude | Edit | CardCollectionModal.tsx - stopPropagation on the fullscreen viewer (portal events bubble through the React tree), touch-none, scroll lock, overscroll-contain
[2026-08-27 16:00] Major | Claude | Edit | src/hooks/usePullToRefresh.ts - stand down while an overlay is open
[2026-08-27 16:00] Major | Claude | Command | npm run build - compiles clean (browser verification skipped at the user's request)
[2026-08-27 16:29] Major | Claude | Edit | src/hooks/usePullToRefresh.ts - always record the gesture origin (stale startY was the intermittent failure), require the gesture to start at the top, hold onRefresh in a ref so the touch listeners stop rebinding every render
[2026-08-27 16:29] Major | Claude | Command | npm run build - compiles clean (browser verification skipped at the user's request)
[2026-08-27 16:30] Major | Antigravity | Fix | Enhanced pull-to-refresh touch detection and responsiveness
[2026-08-27 16:35] Major | Antigravity | Write | e2e/ - automated Playwright E2E testing framework
[2026-08-27 16:43] Major | Antigravity | Fix | src/hooks/usePullToRefresh.ts - fixed touch delta calculation on pull
[2026-08-27 16:43] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 18/18 passed
[2026-08-27 16:44] Major | Antigravity | Command | git push origin main - triggered GitHub Pages deploy
[2026-08-27 16:47] Major | Antigravity | Edit | playwright.config.ts, package.json - added HTML reporter and test:e2e:report
[2026-08-27 16:50] Major | Antigravity | Release | v0.2.4 - pull-to-refresh fix and Playwright HTML reporting
[2026-08-27 17:34] Major | Antigravity | Edit | src/store/collectionStore.ts - set default showFullColor to true (Vivid full-color cards by default)
[2026-08-27 18:22] Major | Antigravity | Fix | public/sw.js, CollectionCardItem.tsx - Cache-First for R2 images, memoize card grid, remove scroll flicker
[2026-08-27 18:22] Major | Antigravity | Release | v0.2.5 - persistent card image caching and scroll performance optimization
[2026-08-28 09:46] Major | Antigravity | Write | implementation_plan.md - Lorcana Deck Builder plan
[2026-08-28 09:50] Major | Antigravity | Write | src/types/deck.ts, src/utils/deckCalculator.ts, src/store/deckStore.ts
[2026-08-28 09:51] Major | Antigravity | Write | src/components/deck/*, src/components/layout/BottomNav.tsx
[2026-08-28 09:52] Major | Antigravity | Edit | src/App.tsx, src/components/collection/CollectionHeader.tsx - Deck mode navigation
[2026-08-28 09:52] Major | Antigravity | Write | e2e/deck-builder.spec.ts - Playwright e2e test suite for Deck Builder
[2026-08-28 09:52] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 20/20 passed
[2026-08-28 10:00] Major | Antigravity | Edit | src/utils/cardImage.ts - robust R2 CDN fallback & cascading error handler
[2026-08-28 10:00] Major | Antigravity | Write | src/hooks/useOTAUpdate.ts, src/components/common/OTAUpdateBanner.tsx, OTAUpdateButton.tsx
[2026-08-28 10:00] Major | Antigravity | Edit | vite.config.ts, src/App.tsx, CollectionHeader.tsx, DeckHeader.tsx - PWA OTA Suite
[2026-08-28 10:00] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 20/20 passed
[2026-08-28 10:01] Major | Antigravity | Release | v0.3.0 - Lorcana Deck Builder, PWA OTA updates, Cloud Sync, and card image CDN fixes
[2026-08-28 10:01] Major | Antigravity | Command | git push origin main --tags - triggered GitHub Pages deploy
[2026-08-28 10:19] Major | Antigravity | Edit | 100% English translation across all UI components, stores, utils & E2E tests
[2026-08-28 10:19] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 20/20 passed
[2026-08-28 10:33] Major | Antigravity | Edit | src/components/deck/DeckEditor.tsx - added List/Grid view toggle & visual card grid mode for Cards in Deck
[2026-08-28 10:33] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 20/20 passed
[2026-08-28 10:38] Major | Antigravity | Branch | created feature/card-pricing for card pricing metadata design
[2026-08-28 10:53] Major | Antigravity | Fix | fixed mobile header overlapping on small screens & integrated deckStore cloud sync in auth listener
[2026-08-28 10:53] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 22/22 passed
[2026-08-28 11:01] Major | Antigravity | Edit | src/constants/version.ts, CollectionHeader.tsx, DeckHeader.tsx - display app version in sync badges
[2026-08-28 11:01] Major | Antigravity | Edit | firestore.rules - added security rule for /users/{uid}/decks/{deckId}
[2026-08-28 11:01] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 22/22 passed
[2026-08-28 11:08] Major | Antigravity | Edit | CollectionHeader.tsx, DeckHeader.tsx - 2-row clean mobile header layout
[2026-08-28 11:08] Major | Antigravity | Fix | src/store/deckStore.ts - sanitize undefined fields & added fallback sync to binders doc
[2026-08-28 11:08] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 22/22 passed
[2026-08-28 11:12] Major | Antigravity | Fix | deckStore.ts - fix reserved firestore doc id (__lorcana_decks__ -> lorcana_decks_vault)
[2026-08-28 11:12] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 22/22 passed
[2026-08-28 11:15] Major | Antigravity | Fix | CollectionHeader.tsx, DeckHeader.tsx - restored Install PWA button on mobile & deck builder
[2026-08-28 11:15] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 22/22 passed
[2026-08-28 11:19] Major | Antigravity | Write | AGENTS.md, CLAUDE.md, .agents/rules - enforce version bump & git tagging
[2026-08-28 11:19] Major | Antigravity | Release | v0.3.1 - restored Install PWA & cross-agent deploy tagging rule
[2026-08-28 11:22] Major | Antigravity | Merge | merged main (v0.3.1) into feature/card-pricing
[2026-08-28 11:25] Major | Antigravity | Write | src/types/pricing.ts, scripts/fetch-lorcana-prices.mjs - pricing pipeline
[2026-08-28 11:25] Major | Antigravity | Write | .github/workflows/update-prices-cron.yml - automated daily price fetch cron
[2026-08-28 11:26] Major | Antigravity | Write | src/store/pricingStore.ts, firestore.rules - market & user price persistence
[2026-08-28 11:26] Major | Antigravity | Write | src/components/admin/AdminPriceManager.tsx - 1-click sync & price editor
[2026-08-28 11:28] Major | Antigravity | Edit | CardCollectionModal.tsx - Market Reference & User Custom Price valuation UI
[2026-08-28 11:28] Major | Antigravity | Edit | DeckEditor.tsx - live deck market value calculation & currency switcher
[2026-08-28 11:31] Major | Antigravity | Write | e2e/pricing.spec.ts - pricing system E2E tests
[2026-08-28 11:36] Major | Antigravity | Write | src/components/common/CurrencySelector.tsx - multi-currency dropdown/tabs/compact
[2026-08-28 11:36] Major | Antigravity | Edit | pricingStore.ts, CardCollectionModal.tsx, CollectionHeader.tsx - THB/USD/EUR/GBP/JPY
[2026-08-28 11:36] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 28/28 passed
[2026-08-28 11:40] Major | Antigravity | Edit | CollectionCardItem.tsx - display price badges on card grid items
[2026-08-28 11:40] Major | Antigravity | Edit | CollectionFilterBar.tsx, CollectionTracker.tsx, types - sort by Market Price
[2026-08-28 11:40] Major | Antigravity | Command | npm run lint && npm run build && npx playwright test - 30/30 passed
[2026-08-28 11:46] Major | Antigravity | Edit | package.json, version.ts - bump version to v0.4.0
[2026-08-28 11:46] Major | Antigravity | Release | v0.4.0 - Card Pricing, Valuation & Multi-Currency System
[2026-08-28 11:52] Major | Antigravity | Write | src/types/pricing.ts, fetch-prices - added PSA 10 graded price support
[2026-08-28 11:52] Major | Antigravity | Edit | CardCollectionModal.tsx, AdminPriceManager.tsx - PSA 10 market & slab tools
[2026-08-28 11:55] Major | Antigravity | Edit | package.json, version.ts - bump version to v0.4.1
[2026-08-28 11:56] Major | Antigravity | Release | v0.4.1 - PSA 10 Graded Market Prices & Graded Slab Management
[2026-08-28 12:10] Major | Antigravity | Edit | src/types/pricing.ts, pricingStore.ts - added Last Sold & Sales transactions
[2026-08-28 12:10] Major | Antigravity | Edit | CardCollectionModal.tsx - 1-Click market links (eBay, TCG) & sales feed
[2026-08-28 12:10] Major | Antigravity | Edit | AdminPriceManager.tsx - Last Sold column & transaction recorder
[2026-08-28 12:13] Major | Antigravity | Edit | package.json, version.ts - bump version to v0.5.0
[2026-08-28 12:14] Major | Antigravity | Release | v0.5.0 - Recent Sales Tracking, Last Sold Stats & 1-Click Market Links
[2026-08-28 12:56] Major | Antigravity | Write | CLAUDE.md - full agent operating guide & workflows for Claude
[2026-08-28 16:34] Major | Antigravity | Edit | collectionStore.ts, deckStore.ts - added cloudLoadedUid safety write guards
[2026-08-28 16:34] Major | Antigravity | Write | collectionStore.cloudGuard.test.ts, deckStore.cloudGuard.test.ts - Vitest tests
[2026-08-28 16:35] Major | Antigravity | Edit | package.json, version.ts - bump version to v0.5.1
[2026-08-28 16:36] Major | Antigravity | Release | v0.5.1 - Cloud-Write Safety Guard (cloudLoadedUid) & Vitest Regression Suite

