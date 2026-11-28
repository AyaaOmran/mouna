---
name: nestjs-universe
description: NestJS standards for the MONAT API. Use when editing NestJS modules, controllers, services, DTOs, entities, guards, processors, migrations, or Vitest tests in this repository. ESM, TypeORM, PostgreSQL, Vitest, Redis, and BullMQ only.
---

# NestJS Universe (MONAT)

This skill is the MONAT profile of the original `nestjs-universe` skill. The untouched original is in `originals/nestjs-universe/`. Do not load Kafka, gRPC, microservices, Sequelize, or Docker from that original. Socket.IO is allowed only for the documented order-status monitoring channel.

## Detected stack

| Choice | Rule |
|---|---|
| ESM | `package.json` uses `"type": "module"`; TypeScript uses `NodeNext`; relative imports use `.js` suffixes. |
| TypeORM | The only ORM. `synchronize: false`. |
| Vitest | The only test runner. |
| class-validator | The only DTO validator. |
| BullMQ | The only queue. |
| Socket.IO | Order-status monitoring only; REST remains authoritative. |

## Invariants

- One module owns each table. Export services only.
- No `@Global()` feature modules and no `forwardRef`.
- Global `ValidationPipe` with whitelist and forbid non-whitelisted.
- Map responses to DTOs. Never return password, refresh-token, or OTP hashes.
- Global auth guard plus `@Public()`. Admin permission guard uses the section catalogue.
- Another customer's id is 404.
- Validate env vars at startup.
- Migrations run before traffic, not on boot.

## Read one reference

- Modules and DI: [references/architecture-and-modules.md](references/architecture-and-modules.md)
- HTTP and errors: [references/http-and-realtime-apis.md](references/http-and-realtime-apis.md)
- TypeORM: [references/database-orm-migrations.md](references/database-orm-migrations.md)
- Auth: [references/auth-and-security.md](references/auth-and-security.md)
- Performance: [references/performance-and-caching.md](references/performance-and-caching.md)
- Vitest: [references/testing-and-quality.md](references/testing-and-quality.md)
- BullMQ: [references/queues-and-background-jobs.md](references/queues-and-background-jobs.md)
- Realtime and patterns: [references/realtime-and-patterns.md](references/realtime-and-patterns.md)

Product behavior stays in `docs/`. This skill does not restate it.

Optional scaffolds, only when creating the foundation from scratch:

- [assets/core-bootstrap.md](assets/core-bootstrap.md)
- [assets/auth-guard.md](assets/auth-guard.md)

Deployment assets are held. There is no CI vendor yet.
