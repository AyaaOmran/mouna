---
name: evidence-first
description: Keep MONAT feature changes source-backed, narrowly scoped, and token-efficient. Use when planning, reviewing, or changing behavior, contracts, schema, security, or state transitions.
---

# Evidence-first MONAT work

Read only the required authority for the task: the feature document and business logic first; then state machines for status changes, database design for schema, Swagger/API docs for HTTP, and the relevant engineering document for security, jobs, or performance. Do not load unrelated feature files or preserved originals unless a conflict requires them.

Before changing behavior, identify the authorizing document and section. If none exists, record an open question rather than inventing an endpoint, field, provider, status, enum, or policy.

Keep the change surface small. Prefer the existing module, service, DTO, transaction, and documented port over a new abstraction. For a contract change, update Swagger, decorators, DTOs, tests, and the API version together.

Use [FEATURE_CHANGE_TEMPLATE.md](../../../docs/planning/FEATURE_CHANGE_TEMPLATE.md) for the progress entry. Report only evidence: files changed, commands actually run, results, and remaining limitations. Never claim that tests, validation, a migration, or a performance target passed without its recorded command and output.

For efficient work, search targeted paths first, inspect narrow ranges, and review the diff before reopening whole documents. Summarize findings and decisions instead of pasting large source text.
