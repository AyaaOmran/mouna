# MONAT architecture package

This archive is the pre-implementation architecture for MONAT (مونة الجدّات). It configures a Cursor coding agent and defines the backend design. It does not contain application source.

The Arabic concept, ERD v2, endpoint list, OpenAPI contract, scaffold `AGENTS.md`, and the original `nestjs-universe` skill are preserved unchanged under `originals/`. Approved changes are recorded in ADRs and the working documents. They do not rewrite those originals.

## How to use this package

1. Add this tree to the repository root before implementation. `AGENTS.md` and `.cursor/` are meant to live at the root.
2. The scaffold `AGENTS.md` already in the repository targets ESM and Vitest. Replace it with this package's `AGENTS.md`. The scaffold copy is kept in `originals/scaffold-AGENTS.md`.
3. Implement only from `docs/`. Follow `.cursor/skills/monat-feature-workflow/SKILL.md` for each feature.
4. Do not mark a feature Verified unless its required tests were executed and passed.

## Package map

| Path | Purpose |
|---|---|
| `AGENTS.md` | Always-loaded agent instructions. Short on purpose. |
| `.cursor/rules/` | Conditional rules. None are always applied. |
| `.cursor/skills/nestjs-universe/` | NestJS standards for this stack, loaded on demand. |
| `.cursor/skills/monat-feature-workflow/` | Required steps for every feature, loaded on demand. |
| `docs/product/` | Scope, business rules, roles. |
| `docs/architecture/` | System design, modules, flows, state machines, ADRs. |
| `docs/database/` | ERD index, schema deltas, migration rules. |
| `docs/api/` | Endpoint index, conventions, contract deltas, errors, localization. |
| `docs/engineering/` | Stack, security, performance, jobs, tests, CI, operations. |
| `docs/features/` | One file per confirmed feature. |
| `docs/planning/` | Plan, status, progress, traceability, quality, open questions. |
| `originals/` | Untouched source material. |

## Authority order

When two documents disagree, use this order:

1. ADRs in `docs/architecture/adr/` for decisions approved after the concept.
2. `docs/product/BUSINESS_LOGIC.md` and `docs/architecture/STATE_MACHINES.md` for behavior.
3. The Arabic concept in `originals/` for product behavior that an ADR does not change.
4. `originals/openapi.yaml` for request and response shapes, except the deltas in `docs/api/API_CONTRACT_DELTAS.md`.
5. `originals/Monat_AlJaddat_ERD_v2.md` for the data model, plus `docs/database/DATABASE_DESIGN.md` for approved schema additions.

## Token loading

| Layer | When it loads | What it contains |
|---|---|---|
| Always | Every Cursor session | `AGENTS.md` only. |
| Conditional | A matching file is in context | One `.cursor/rules/*.mdc` file. `alwaysApply` is false on every rule. |
| On demand | The task matches the skill description | `nestjs-universe` or `monat-feature-workflow`, then only the reference that skill points to. |
| Not loaded | Until the feature workflow says to read it | Feature docs, ADRs, OpenAPI, the concept. |

No subagents are defined. Kafka, gRPC, microservices, Socket.IO, and deployment assets are not part of the active skill.

## Status of this package

Architecture and agent configuration only. No application code was implemented. No test suite was executed. Every feature in `docs/planning/IMPLEMENTATION_STATUS.md` is Not Started. Quality criteria are designed here and are not claimed as verified.

## Versions

Version pins and their sources are in `docs/engineering/TECH_STACK.md`. They were checked on 27 November 2026.
