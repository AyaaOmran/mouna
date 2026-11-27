---
name: nestjs-universe
description: "Provides production backend standards for NestJS (ESM/CommonJS, TypeORM/Sequelize). Use when designing, building, refactoring, debugging, testing, or reviewing NestJS modules, DI, DTOs/ValidationPipe, error filters, JWT/RBAC/ownership auth, ORM transactions/migrations, N+1/pagination/Redis cache/throttling, BullMQ queues, @nestjs/schedule cron, nest-commander CLI, KafkaJS, gRPC/circuit breakers, CQRS/WebSockets, Vitest/Jest/Supertest tests, or NestJS Docker/K8s/CI, including *.module.ts, *.controller.ts, *.service.ts, *.entity.ts, *.dto.ts, *.filter.ts, *.guard.ts, *.scheduler.ts, *.command.ts, *.processor.ts, *.gateway.ts. Do NOT use for frontend/UI, non-NestJS Express/Fastify/Go apps, or standalone PostgreSQL DBA tuning."
---

# NestJS Universe — Backend Engineering Skill

Production standards for NestJS backends covering modular architecture, HTTP/WebSocket APIs, TypeORM/Sequelize persistence, JWT/RBAC security, caching, testing, BullMQ, Kafka, microservices/gRPC, and Docker/CI operations.

---

## 1. Stack Context Detection (Run First)

Inspect `package.json` and `tsconfig.json` before opening references or editing code. Match the repository's existing stack, ORM, validator, HTTP prefix, and error format — apply only the rules that fit its actual stack instead of imposing defaults:

| Signal in `package.json` / `tsconfig.json` | Active Profile | Key Rules Triggered |
| :--- | :--- | :--- |
| `"type": "module"` *(default for new apps)* | **Native ESM** | Append `.js` to all relative imports; wrap TypeORM relations in `Relation<T>` |
| No `"type": "module"` | **CommonJS (CJS)** | Omit `.js` import extensions; follow CJS deltas only where noted |
| `@nestjs/typeorm` + `typeorm` *(canonical default)* | **TypeORM** | Primary persistence patterns across all references |
| `@nestjs/sequelize` + `sequelize-typescript` | **Sequelize** | Follow opt-in `#### If project uses Sequelize` blocks in `database-orm-migrations.md` |
| `vitest` *(default)* vs `jest` | **Test Runner** | Use Vitest ESM mocks/config vs Jest patterns in `testing-and-quality.md` |

### Action Policy: Reversible Code vs. New Infrastructure
- **Already in `package.json` or explicitly requested:** Proceed directly using the matching reference file below.
- **Not installed and no real constraint requires it:** Stay simple — modular monolith, concrete `@Injectable()` services, synchronous DB queries, zero speculative abstractions.
- **Not installed, but a concrete requirement or bottleneck warrants new infrastructure or architectural layers:** Do not add them silently; read the relevant reference's decision criteria, briefly compare the simple option vs. the heavier option, and confirm with the user first.

---

## 2. Universal Invariants

Enforce these cross-cutting rules on every NestJS task regardless of feature domain:

### Architecture & ESM
- **Feature modules & single table ownership:** Organize `src/` by domain feature (never `controllers/` or `services/`). Exactly one module owns each database table (`TypeOrmModule.forFeature([Entity])`).
- **Service-only exports & one-way DAG:** Export only services in `@Module({ exports })` — never export repositories or `TypeOrmModule`. Break module cycles by extracting a third module or emitting events instead of `forwardRef()`.
- **Minimal global & singleton scope:** Restrict `@Global()` strictly to core infrastructure (`ConfigModule` or a shared `RedisModule`), never feature modules. Keep default singleton provider scope and avoid `Scope.REQUEST` propagation.
- **Native ESM hygiene:** In `"type": "module"` projects (`module: nodenext`), append `.js` to every relative import path and wrap every TypeORM relation property in `Relation<T>` (`import type { Relation } from 'typeorm'`).

### HTTP Contracts & Error Handling
- **Strict input validation:** Register global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in a shared `configureApp(app)` helper.
- **Query & Response DTOs:** Use class Query DTOs for multi-param/numeric queries (never `DefaultValuePipe` + `ParseIntPipe` under global `transform: true`). Never return raw ORM entities — map to explicit Response DTOs with zero leaked secrets (`password`, `passwordHash`, `refreshToken`, `refreshTokenHash`).
- **Centralized error filter & PG `23505`:** Catch exceptions in a global `HttpErrorFilter` following the repository's error envelope, map PostgreSQL `23505` unique violations to `409 Conflict`, and never expose raw SQL or stack traces.

### Security, Config & Operations
- **Fail-closed auth & RBAC:** Register JWT auth via global `APP_GUARD` and opt out public routes via `@Public()` read with `reflector.getAllAndOverride([context.getHandler(), context.getClass()])`. Never accept client-supplied `role` during registration.
- **Anti-oracle ownership enforcement:** Always pair RBAC with service-level record ownership checks on user-scoped resources, and never leak whether another user's ID exists by mixing `404` (missing) and `403` (unowned) for non-admins.
- **Startup config validation:** Validate all env vars at boot via `ConfigModule.forRoot` schema validation and inject typed `registerAs` config groups via `.KEY` rather than reading raw `process.env` in services.
- **Schema & shutdown safety:** Keep `synchronize: false` (manage schema changes via versioned migrations), run migrations once pre-rollout (never on app boot), and call `app.enableShutdownHooks()` so containers drain cleanly on `SIGTERM`.

---

## 3. References (Load Only What Applies)

Read only the reference file(s) relevant to your task (skip references for trivial local edits already covered by the invariants above). All references are 1 hop from this file:

- **Architecture, Modules & DI:** Feature boundaries, circular imports, ESM, `CoreModule`/CLI, Joi + `registerAs`, `Symbol` DI, pragmatic SOLID, `@nestjs/cqrs` — [references/architecture-and-modules.md](references/architecture-and-modules.md)
- **HTTP APIs & WebSockets:** Request lifecycle, `@Res()`, `ValidationPipe`, Query/Response DTOs, `HttpErrorFilter` (`23505` -> `409`), `NestInterceptor`, OpenAPI, Socket.IO handshake auth — [references/http-and-realtime-apis.md](references/http-and-realtime-apis.md)
- **Database, ORM & Migrations:** PostgreSQL types in ORM, TypeORM ESM `Relation<T>`, Sequelize adapter, transaction propagation, expand-and-contract migrations, seeders, FK indexes — [references/database-orm-migrations.md](references/database-orm-migrations.md)
- **Auth & Security:** JWT auth, global `APP_GUARD` + `@Public()`, uniform `401`, hashed opaque refresh tokens + logout revocation, RBAC (`Roles` vs `resource:action`), anti-oracle ownership, secret redaction — [references/auth-and-security.md](references/auth-and-security.md)
- **Performance & Caching:** Performance loop, `TimingInterceptor`, bare indexed columns, ORM N+1, bounded pagination + sort whitelist, `ioredis` fail-open cache-aside + invalidation, Redis `@nestjs/throttler` — [references/performance-and-caching.md](references/performance-and-caching.md)
- **Testing & Quality:** Test pyramid, `@nestjs/testing` mocks, Vitest ESM vs Jest, isolated test DB (`fileParallelism: false` + `TRUNCATE CASCADE`), shared `configureApp(app)`, regression-first fixes, Artillery — [references/testing-and-quality.md](references/testing-and-quality.md)
- **Queues & Background Jobs:** Sync vs async, `@nestjs/bullmq` `WorkerHost`, thin `@Cron` -> queue, retries/backoff, catch-log-rethrow, `job.id` idempotency, failed DLQ, guarded Bull Board — [references/queues-and-background-jobs.md](references/queues-and-background-jobs.md)
- **Kafka & Event-Driven Architecture:** KRaft + `kafkajs`, `producerOnlyMode`, `acks=all`, entity-ID partition keys, `<groupId>-server`, manual `offset + 1` commits, transactional outbox, `processed_events`, DLQ — [references/kafka-and-eda.md](references/kafka-and-eda.md)
- **Microservices & gRPC:** Modular monolith vs Strangler Fig, DB-per-service snapshots, gateway header sanitization + `X-Correlation-Id`, nested timeouts, retries inside circuit breaker, `Idempotency-Key`, sagas, `buf` + `ts-proto` gRPC — [references/microservices-and-grpc.md](references/microservices-and-grpc.md)
- **Deployment & Ops:** Multi-stage Node LTS `Dockerfile`, immutable tags, GitHub Actions CI, Terminus liveness (no DB) vs readiness (DB), graceful shutdown, pre-rollout migrations, rollbacks — [references/deployment-and-ops.md](references/deployment-and-ops.md)

> **Database deferral boundary:** `nestjs-universe` owns NestJS application architecture, ORM mapping, transactions, migrations, and app-layer caching.
> Defer standalone PostgreSQL engine administration (autovacuum tuning, PgBouncer pooling, RLS policies, and deep `EXPLAIN` planner/buffer internals) to `supabase-postgres-best-practices`.

---

## 4. Verification Before Completion

Before declaring a NestJS change complete:
1. Verify no applicable Universal Invariant (Section 2) or loaded reference rule was violated, and no unsolicited infrastructure or speculative abstraction was introduced.
2. Run the typecheck, lint, and test suites relevant to the change (and available in the repository) with zero skipped or weakened assertions.

---

## 5. Optional `assets/` Scaffolding Index

Load these fenced Markdown blueprints **only** when scaffolding greenfield boilerplate from scratch (skip them for routine edits, existing repo conventions, or reviews):

- [assets/core-bootstrap-and-error-filter.md](assets/core-bootstrap-and-error-filter.md) — `CoreModule`, Joi + `registerAs`, shared `configureApp(app)` / `main.ts`, `HttpErrorFilter` (`23505` -> `409`).
- [assets/auth-guard-refresh-rbac.md](assets/auth-guard-refresh-rbac.md) — Global `APP_GUARD`, `@Public()`, `PermissionsGuard`, opaque SHA-256 refresh/logout helper.
- [assets/grpc-proto-and-error-filter.md](assets/grpc-proto-and-error-filter.md) — `buf.gen.yaml`, `.proto`, `Transport.GRPC`, `RpcException`, and gRPC-to-HTTP error filter.
- [assets/docker-and-ci.md](assets/docker-and-ci.md) — Multi-stage Node LTS `Dockerfile`, `.dockerignore`, GitHub Actions CI, Terminus health probes.
- [assets/agents-md-snippet.md](assets/agents-md-snippet.md) — Compact customizable project-root `AGENTS.md` trigger pointer for `nestjs-universe`.
