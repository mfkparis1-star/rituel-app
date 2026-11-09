# Rituel AI Development Studio

## Operating rules
- Work only on a dedicated branch created from the latest main; never commit directly to main. Use names such as ai/<task>, fix/<task>, or the bootstrap branch.
- Keep each branch focused. Run the checks listed below and add or update tests for behavior changes.
- Open a pull request as a draft first. Include the problem, change summary, risks, tests, and any manual verification still needed.
- Do not merge, enable auto-merge, publish a release, submit an app build, deploy, or change production data. Muhammed Fatih Küçük approves all merges and releases.
- Do not add, rotate, print, or transmit credentials. Use only repository-provided test configuration; never point tests at production Supabase or RevenueCat services.
- Treat user data, photos, skin-analysis data, and subscription records as sensitive. Use synthetic fixtures in tests.
- Growth work must be research, analysis, and draft content only. Do not contact users, publish marketing, create ad spend, or access customer personal data.

## Checks
Run npm ci, npm run lint, npm run typecheck, and npm test before requesting review. Report failures honestly; do not weaken checks to make a PR pass.

## PR ownership
Every PR remains unmerged until the owner reviews and merges it. Automated agents may create branches, commits, tests, and draft PRs only.
