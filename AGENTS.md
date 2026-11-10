# Rituel AI Development Studio

## Operating rules
- Work only on a dedicated branch created from the current mobile base `phase15-rebuild`; never commit directly to main. Use names such as `ai-studio/<task>`.
- Keep each branch focused. Run the checks listed below and add or update tests for behavior changes.
- Open a pull request as a draft first. Include the problem, change summary, risks, tests, and any manual verification still needed.
- Do not merge, enable auto-merge, publish a release, submit an app build, deploy, or change production data. Muhammed Fatih Küçük approves all merges and releases.
- Do not add, rotate, print, or transmit credentials. Use only repository-provided test configuration; never point tests at production Supabase or RevenueCat services.
- Treat user data, photos, skin-analysis data, and subscription records as sensitive. Use synthetic fixtures in tests.
- Growth work must be research, analysis, and draft content only. Do not contact users, publish marketing, create ad spend, or access customer personal data.

## Checks
Run `npm ci`, `npm run lint`, `npm run typecheck`, and `npm test` before requesting review. Report failures honestly; do not weaken checks to make a PR pass.

## Roles
Use the focused profiles in `.github/agents/` for design review, product strategy, market research, mobile engineering, security review, test quality, release readiness, product analytics, growth, and dependency review. Only use aggregate metrics for business reporting. Agents propose changes and deliver evidence for owner review. Use design, market, and analytics evidence to prioritize feature briefs before implementation. Verify changes with test, security, and release reviews before proposing distribution. See [quality tooling](docs/AI_STUDIO_TOOLING.md) for scanner and device-test boundaries.

## PR ownership
Every PR remains unmerged until the owner reviews and merges it. Automated agents may create branches, commits, tests, and draft PRs only.
