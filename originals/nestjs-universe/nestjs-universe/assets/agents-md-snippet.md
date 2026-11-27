# Project-Root `AGENTS.md` Snippet

Copy this concise block into your NestJS repository's root `AGENTS.md` and customize the **Stack** line. Keep `AGENTS.md` lean — never paste full reference rules here.

```markdown
## NestJS Backend Standards (`nestjs-universe`)

- **Stack:** <!-- customize --> NestJS · ESM (`"type": "module"`) or CommonJS · TypeORM or Sequelize · PostgreSQL · Vitest or Jest
- **Skill Trigger:** For non-trivial NestJS design, implementation, refactoring, debugging, testing, or review (modules, DTOs/filters, auth/guards, ORM/migrations, caching, BullMQ/Kafka, gRPC/WebSockets, or Docker/CI), open `nestjs-universe` (`SKILL.md`) and read only the matching `references/*.md` file(s).

### Always-Hot Guardrails

1. **Right-Sized Architecture & Boundaries:** Default to a modular monolith, concrete `@Injectable()` services, and synchronous DB queries; if a concrete requirement warrants new infrastructure or architectural layers not yet in `package.json`, propose the trade-off and confirm before installing. One feature module owns each DB table and exports services only; use `.js` relative imports and `Relation<T>` in ESM.
2. **HTTP & Data Integrity:** Enable global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, return explicit Response DTOs (zero secret leaks), map PG `23505` to `409` in `HttpErrorFilter`, and keep `synchronize: false`.
3. **Fail-Closed Auth & Ownership:** Register global `APP_GUARD` with `@Public()` checked via `reflector.getAllAndOverride`; always enforce service-level ownership on user-scoped resources without leaking whether another user's ID exists.
4. **Config & Graceful Lifecycle:** Validate all env vars at startup (`registerAs`), never read raw `process.env` in services, and enable `app.enableShutdownHooks()`.
```

### Usage Notes

- Keep this pointer under 25 lines in your project's root `AGENTS.md`.
- Update the **Stack** line whenever migrating between ESM/CJS, TypeORM/Sequelize, or Jest/Vitest.
