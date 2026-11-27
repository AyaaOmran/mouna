# MONAT agent instructions

MONAT (مونة الجدّات) is a modular-monolith NestJS API. CommonJS, TypeScript, PostgreSQL, TypeORM, Swagger, Jest, Redis, and BullMQ are fixed.

## Before coding

1. Read the feature file in `docs/features/` and `docs/product/BUSINESS_LOGIC.md`.
2. If the work touches status changes, read `docs/architecture/STATE_MACHINES.md`.
3. If the work touches schema or HTTP, read `docs/database/DATABASE_DESIGN.md` and `docs/api/API_CONTRACT_DELTAS.md`.
4. Apply the skill `monat-feature-workflow`. Load `nestjs-universe` when editing NestJS code.
5. Do not invent business rules, entities, endpoints, or providers. Gaps belong in `docs/planning/OPEN_QUESTIONS.md`.

## Invariants

- `synchronize: false`. Schema changes are migrations only.
- Integer primary keys. UUID only on `VoiceMessage` for public QR lookup.
- Controllers validate and map DTOs. Services own business rules. Repositories stay inside the owning module.
- Do not return password hashes, refresh-token hashes, or OTP hashes.
- Human-readable text follows `Accept-Language`. Field names, enums, and status codes do not change by language.
- A feature stays Not Started, In Progress, Blocked, or Implemented until its required tests have been executed and passed. Only then mark it Verified.
- After a feature change, update the feature file, `docs/planning/IMPLEMENTATION_STATUS.md`, and `docs/planning/IMPLEMENTATION_PROGRESS.md`.

## Where detail lives

Design docs are not repeated here. Start at `README.md` in this package, then the feature file.
