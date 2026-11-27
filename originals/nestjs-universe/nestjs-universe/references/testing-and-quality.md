# Testing and Backend Quality

Parent skill: `nestjs-universe`
Scope: NestJS unit, integration, HTTP E2E, black-box contract, and Artillery load testing, Vitest/Jest runner setup, test DB isolation, and regression/PR quality gates. Excludes browser UI testing and CI runner orchestration.
Applies to: `*.spec.ts`, `*.int-spec.ts`, `*.e2e-spec.ts`, `*.pw.ts`, `*.e2e.test.mjs`, `vitest.config*.ts`, `jest.config.*`, `load/*.yml`

## Contents

- [Place Each Test at the Lowest Level That Sees the Rule](#place-each-test-at-the-lowest-level-that-sees-the-rule-medium)
- [Mock Boundaries with Test.createTestingModule and getRepositoryToken](#mock-boundaries-with-testcreatetestingmodule-and-getrepositorytoken-high)
- [Configure Vitest for Native ESM and Isolate Jest Deltas](#configure-vitest-for-native-esm-and-isolate-jest-deltas-medium)
- [Isolate Integration Tests on a Dedicated Test Database](#isolate-integration-tests-on-a-dedicated-test-database-critical)
- [Share configureApp Between main.ts and E2E Tests](#share-configureapp-between-maints-and-e2e-tests-critical)
- [Assert Black-Box HTTP Contracts and Absence of Secrets](#assert-black-box-http-contracts-and-absence-of-secrets-high)
- [Enforce Regression-First Bug Fixes and Clean PR Gates](#enforce-regression-first-bug-fixes-and-clean-pr-gates-high)
- [Gate Latency and Payload Regressions with Artillery](#gate-latency-and-payload-regressions-with-artillery-medium)

### Place Each Test at the Lowest Level That Sees the Rule [MEDIUM]

**Rule:** Test business rules, edge cases, and error paths at the cheapest suite level capable of observing the failure. Skip framework internals (such as `@Get()` route binding) and trivial getters.

| Level | File Pattern | Runs For Real | Replaced | Catches |
| :--- | :--- | :--- | :--- | :--- |
| **Unit** | `*.spec.ts` | One class or pure function (0–4 ms) | Every dependency | Scoring/discount math, edge cases (`0` matches), thrown domain exceptions |
| **Integration** | `*.int-spec.ts` | Real services + PostgreSQL (~40 ms) | Nothing (except external APIs) | ORM queries, unique/FK constraints, transactions, idempotent batch jobs |
| **E2E / Contract** | `*.e2e-spec.ts`, `*.pw.ts`, `*.e2e.test.mjs` | Full HTTP pipeline + DB (30–110 ms) | Outbound external services only | Global prefix, `ValidationPipe`, guards, `HttpErrorFilter`, ownership/RBAC |
| **Load / Stress** | `load/*.yml` | Built app under concurrent virtual users | None (staging/disposable copy) | Unpaginated lists, connection pool exhaustion, p95 spikes |

**Why:** Driving the full HTTP stack to test a pure calculation slows feedback, while mocked unit tests cannot see removed DB unique constraints, missing global prefixes, or unbounded list responses. Always pair happy-path tests with edge cases (a broken `candidate.skills.length` scorer still passes when the candidate happens to hold 2 matching skills).

### Mock Boundaries with Test.createTestingModule and getRepositoryToken [HIGH]

**Rule:** Build service unit tests with `Test.createTestingModule`, replacing repositories via `getRepositoryToken(Entity)` and cross-module services or symbol tokens via `useValue` (or `.overrideProvider()`). Call `vi.clearAllMocks()` in `beforeEach` and mock only dependency boundaries, never internal private calls.

**Why:** Unit tests must run without PostgreSQL or outbound services so any failure pinpoints one class, while over-mocking internal call order couples tests to implementation details rather than observable behaviour.

```ts
// ❌ Incorrect: boots TypeOrmModule against PostgreSQL in a unit spec
const moduleRef = await Test.createTestingModule({
  imports: [CoreModule, ApplicationsModule],
}).compile();

// ✅ Correct: pure DI fakes for repository, sibling services, and symbol token
const repo = { create: vi.fn((x) => x), save: vi.fn(async (x) => x) };
const jobsService = { findOpen: vi.fn() };
const notifier = { send: vi.fn() };

beforeEach(async () => {
  vi.clearAllMocks();
  const moduleRef = await Test.createTestingModule({
    providers: [
      ApplicationsService,
      { provide: getRepositoryToken(Application), useValue: repo },
      { provide: JobsService, useValue: jobsService },
      { provide: NOTIFIER, useValue: notifier },
    ],
  }).compile();
  service = moduleRef.get(ApplicationsService);
});
```

### Configure Vitest for Native ESM and Isolate Jest Deltas [MEDIUM]

**Rule:** In native ESM (`"type": "module"`), prefer Vitest with `vite-tsconfig-paths` and `globals: true`, split across `vitest.config.ts` (`**/*.spec.ts`), `vitest.config.int.ts` (`**/*.int-spec.ts`), and `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`).

**Why:** Vitest handles native ESM `.js` relative imports without experimental Node VM flags, while separate configs keep unit runs instant and database-free.

```ts
// ✅ Correct: vitest.config.ts (Native ESM default)
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { globals: true, root: './', include: ['**/*.spec.ts'] },
});
```

#### If project uses Jest (CommonJS or ESM)

Replace `vi.fn()` / `vi.clearAllMocks()` with `jest.fn()` / `jest.clearAllMocks()` (import `{ expect, jest }` from `@jest/globals` in ESM). CommonJS projects run Jest with minimal config; ESM projects on Jest + `ts-jest` require `NODE_OPTIONS=--experimental-vm-modules`, `extensionsToTreatAsEsm: ['.ts']`, `moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }`, `ts-jest` with `useESM: true`, and an explicit `rootDir` in `tsconfig.jest.json` when TypeScript enforces `TS5011`.

### Isolate Integration Tests on a Dedicated Test Database [CRITICAL]

**Rule:** Point integration and E2E suites at a dedicated test database (e.g., `hiring_test`) via test-runner `env` overrides — never development or production. Disable cross-file parallelism (`fileParallelism: false`), run `TRUNCATE ... RESTART IDENTITY CASCADE` before each test, and close the testing module or app in `afterAll`.

**Why:** Parallel spec files sharing one PostgreSQL instance race on table rows and produce flaky failures; leaving connections open hangs the runner process.

```ts
// ❌ Incorrect: inherits dev .env DATABASE_URL and runs files in parallel
export default defineConfig({ test: { include: ['**/*.int-spec.ts'] } });

// ✅ Correct: dedicated DB, serial file execution, clean state per test
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['**/*.int-spec.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://postgres@localhost:5432/hiring_test',
    },
  },
});
// In spec: beforeEach -> dataSource.query('TRUNCATE application, job, company RESTART IDENTITY CASCADE')
// In spec: afterAll   -> await moduleRef.close()
```

### Share configureApp Between main.ts and E2E Tests [CRITICAL]

**Rule:** Move `setGlobalPrefix`, global `ValidationPipe`, and global `HttpErrorFilter` into a shared `configureApp(app)` function in `src/app.setup.ts`, and call it from both `src/main.ts` and every E2E `beforeAll`. Replace only external boundaries (e.g., `NOTIFIER`) via `.overrideProvider()`.

**Why:** Calling `moduleRef.createNestApplication()` without `configureApp` strips the global prefix (causing 404 on every route), disables DTO validation, and disables DB error mapping (`23505` to `409`), so E2E tests no longer verify the deployed pipeline.

```ts
// ❌ Incorrect: E2E skips main.ts global prefix, ValidationPipe, and HttpErrorFilter
app = moduleRef.createNestApplication();
await app.init();

// ✅ Correct: identical HTTP pipeline to production; only external boundary mocked
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(NOTIFIER)
    .useValue({ send: vi.fn() })
    .compile();
  app = configureApp(moduleRef.createNestApplication());
  await app.init();
  http = request(app.getHttpServer());
});
afterAll(async () => app.close());
```

### Assert Black-Box HTTP Contracts and Absence of Secrets [HIGH]

**Rule:** Assert exact status codes, structured error codes (`error.code`, `error.details`), response contracts (confirming `password` and `refreshToken` never appear in any single or list payload), and cross-request invariants (such as `priceAtEnrollment` staying immutable after a course `PATCH`). Use Supertest for in-process Nest E2E, `node --test` `.mjs` contract scripts against a live `BASE_URL`, or `@playwright/test` named `*.pw.ts` (never `*.spec.ts`, so Vitest ignores them) with `webServer`.

**Why:** Status-only checks miss silent regressions like returning `200` on invalid `PATCH` inputs, leaking password hashes in list endpoints, or leaking record existence via inconsistent ownership errors.

```ts
// ❌ Incorrect: weak check misses error envelope and field validation details
await http.post('/v1/applications').send({ candidateId: 'bad' }).expect(400);

// ✅ Correct: verifies status, error contract, invalid fields, and conflict code
const res = await http
  .post('/v1/applications')
  .send({ candidateId: 'not-a-uuid' })
  .expect(400);
expect(res.body.error.code).toBe('VALIDATION_FAILED');
expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(
  expect.arrayContaining(['candidateId', 'jobId']),
);
```

### Enforce Regression-First Bug Fixes and Clean PR Gates [HIGH]

**Rule:** Start every bug fix by writing a failing test that reproduces the defect, make it pass, and keep it permanently. Use `npm run test:cov` to locate untested error branches rather than chasing 100%, never weaken or delete failing assertions to pass CI, and never commit `it.skip`, `describe.skip`, or `.only`.

**Why:** 100% line coverage with weak assertions still ships bugs (a single happy path executes the buggy line), and skipped tests hide regressions until users hit them.

```ts
// ❌ Incorrect: silences a failing regression instead of fixing PATCH validation
it.skip('rejects PATCH that drives finalPrice negative', async () => { /* ... */ });

// ✅ Correct: permanent regression test reproducing the exact PATCH edge case
it('rejects PATCH price below fixed discount with 400', async () => {
  const course = await createCourse({ price: 100, discountType: 'FIXED', discountValue: 40 });
  await http.patch(`/v1/courses/${course.id}`).send({ price: 30 }).expect(400);
});
```

### Gate Latency and Payload Regressions with Artillery [MEDIUM]

**Rule:** Define warm-up, ramp-up, and spike phases in `load/*.yml` with `plugins: { ensure: {} }` and explicit `ensure.thresholds` (`http.response_time.p95`, `maxErrorRate`) so CI fails with exit code 1 when endpoints degrade. Run load suites on a schedule or pre-release against a realistic non-production environment — never against production.

**Why:** Functional tests pass even when an unpaginated list returns megabytes and spikes p95 to multi-second timeouts under load; omitting `plugins: ensure: {}` causes Artillery to silently ignore all threshold checks.

```yaml
# ❌ Incorrect: ensure block without plugins.ensure silently exits 0 on failures
ensure:
  thresholds: [{ http.response_time.p95: 300 }]

# ✅ Correct: enables ensure plugin and enforces p95 + error-rate gates
config:
  target: http://localhost:3000/v1
  phases:
    - { name: Warm up, duration: 20, arrivalRate: 5 }
    - { name: Ramp up, duration: 30, arrivalRate: 5, rampTo: 50 }
    - { name: Spike, duration: 20, arrivalRate: 100 }
  plugins:
    ensure: {}
  ensure:
    thresholds:
      - http.response_time.p95: 300
    maxErrorRate: 1
```
