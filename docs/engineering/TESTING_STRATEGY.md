# Testing strategy

Vitest is the only runner. Tests live beside the code as `*.spec.ts`. End-to-end tests live in `test/`. Keep `vitest.config.ts` for unit/integration tests and a dedicated `vitest.config.e2e.ts` for E2E tests. Import `describe`, `it`, `expect`, and `vi` explicitly from `vitest`; do not rely on globals. Use `vi.fn`, `vi.spyOn`, and `vi.mock` for test doubles.

## Layers

| Layer | Covers | Database |
|---|---|---|
| Unit | State decisions, fee math, locale fallback, permission checks with a mocked repository | none |
| Integration | Transactions, locks, migrations, webhook idempotency, expiry | PostgreSQL and Redis provided by the environment |
| E2E | Register and login, regular checkout, shipping approval and pay, subscription activation, permission denial | same |

Do not require Docker. The Vitest scripts are `test: "vitest run"`, `test:watch: "vitest"`, `test:cov: "vitest run --coverage"`, and `test:e2e: "vitest run --config ./vitest.config.e2e.ts"`. The test script reads `DATABASE_URL` and `REDIS_URL`. If they are absent, integration tests fail with a clear message. They do not skip silently.

## Required cases before Verified

Each feature file lists its own cases. The payment and order features additionally require:

- Two concurrent checkouts of the last unit. One succeeds and one returns `OUT_OF_STOCK`.
- Webhook replay does not double-confirm.
- Expiry and webhook racing on one order. The cancelled order stays cancelled.
- Customer A cannot read customer B's order.
- Admin without `orders` receives 403.
- Arabic and English error messages for one validation failure, same code and status.
- Address-book limit: fifth active address succeeds; sixth returns `409 ADDRESS_LIMIT_REACHED`; soft-deleted historical rows are excluded; concurrent create requests never produce more than five active rows.

## Data

Seed permissions and settings through migrations. Each test creates its own grandma, product, and user. Truncate application tables between tests. Do not truncate `migrations`.

## Definition of done

A feature is Implemented when the code and docs match and the required tests exist. It is Verified only after those tests were executed in this environment and the progress log records the command and the result. A written test that was not run is not Verified.

## Contract

Supertest checks status, envelope, and the fields the feature claims to implement. It does not restate the entire OpenAPI file in one suite. When a delta exists, the test asserts the delta, not the old OpenAPI behavior.

## Regression

A bug fix adds a test that failed before the fix. Do not weaken an assertion to make a run pass.
