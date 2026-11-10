# Rituel quality tooling

The mobile branch is `phase15-rebuild`. Start changes from that branch and open a draft. The quality workflow uses read-only repository permissions. Its scanners use versioned upstream binaries with pinned SHA-256 digests.

| Tool | Use in Rituel |
| --- | --- |
| [ESLint](https://github.com/eslint/eslint) and [Expo config](https://docs.expo.dev/guides/using-eslint/) | Run `npm run lint` to detect JavaScript and React Native issues. SDK 54's current React plugin failed with ESLint 10 during validation. ESLint 9 is a temporary compatibility pin. Revisit it during the SDK upgrade. |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | CI scans the introduced commit range. Secret values are fully redacted. Review findings without printing or copying sensitive values. |
| [OSV-Scanner](https://github.com/google/osv-scanner) | CI scans the base and resulting npm lockfiles. New package and advisory pairs fail the check. Existing findings remain visible in the counts and need separate triage. |
| [Maestro](https://github.com/mobile-dev-inc/Maestro) | On a dedicated simulator with a synthetic backend and installed Rituel build, run `maestro test .maestro/navigation-smoke.yaml`. This flow clears the simulator app's local state and checks navigation to Products, AI Studio and Profile. |
| [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates) | The file proposes weekly npm and monthly Actions version updates for the mobile branch. GitHub reads this configuration from the repository's default branch. Activation requires a separate owner-approved change there. |

The dependency reviewer owns advisory triage. The test and design reviewers use the native flow as a starting point and still check layout, accessibility, account transitions, and Sandbox purchases separately. Keep test input synthetic and record any checks that could not run.
