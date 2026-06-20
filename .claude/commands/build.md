---
description: Typecheck, then EAS development build for iOS
---

Run an iOS development build, gated on a clean typecheck.

1. Run `npx tsc --noEmit`.
2. **If tsc fails:** do NOT build. Show the errors and stop.
3. **If tsc passes:** run `eas build --profile development --platform ios`.
