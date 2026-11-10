# Rituel team workflow

Twenty role profiles are available in `.github/agents/`. The coordinator assigns a bounded group per cycle, records which agents actually ran, and links their work through a shared handoff. A role profile defines a task. It does not start a permanent background process.

| Step | Roles | Handoff |
| --- | --- | --- |
| Evidence | Market research, store optimization, growth, product analysis, analytics engineering | Source, date, baseline, confidence and measurement gaps |
| Product and design | Product strategy, design review, onboarding, localization, accessibility | One prioritized brief with user journey, acceptance cases, and success metric |
| Implementation | Mobile engineering, backend engineering, dependency review | Scoped diff or draft PR, tests, impact, rollback and compatibility notes |
| Independent validation | Test quality, privacy, security, payments, community safety, reliability | Findings ranked by severity, failed and passed checks, and remaining device or Sandbox scenarios |
| Release and learning | Release review and product analysis | Go/no-go evidence and the metric to observe after a verified release |

## Shared handoff

For each task record the objective, owner role, source evidence, branch or artifact, acceptance criteria, and the next role. List unresolved blockers and avoid duplicate work. A specialist verifies the previous handoff before building on it. Use parallel read-only research or separate files for independent implementation tasks.

## Operating limits

Use synthetic data and existing permissions. The default growth budget is zero. The weekly heartbeat reads authorized aggregate sources and drafts a single experiment. It can delegate when supported and records the roles it actually ran. Release work checks current App Store, CI, and device evidence. Keep publication, credentials, production changes and permission changes within the owner's explicit authorization.
