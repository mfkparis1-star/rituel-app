---
description: Typecheck, then commit and push to phase15-rebuild
---

Commit and push the current changes, gated on a clean typecheck.

1. Run `npx tsc --noEmit`.
2. **If tsc fails:** do NOT commit. Show the errors and stop.
3. **If tsc passes:**
   - Review the diff with `git status` and `git diff`.
   - Stage and commit using the repo's convention: `type(scope) — description`
     (em-dash separator; e.g. `fix(makeup) — pass user language`).
   - Push with `git push origin main:phase15-rebuild` (local `main` → remote `phase15-rebuild`).
