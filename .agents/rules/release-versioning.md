# Mandatory Release Versioning & Git Tagging Rule

## Applies To
All AI agents, pairing sessions, and deployment workflows in this repository.

## Rule Requirements
1. **Never deploy or push release commits to `main` without updating the version.**
2. **Synchronize Version Across All Configs**:
   - `package.json` -> `"version": "x.y.z"`
   - `src/constants/version.ts` -> `export const APP_VERSION = 'x.y.z';`
3. **Pre-Deploy Quality Gate**:
   - Must run and pass: `npm run lint && npm run build && npx playwright test`
4. **Git Tag & Push**:
   - Must create an annotated git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z - <summary>"`
   - Must push with tags: `git push origin main --tags`
5. **AI Logging**:
   - Must log `[YYYY-MM-DD HH:MM] Major | <Agent> | Release | vX.Y.Z - <summary>` in `AI_LOG.md`.
