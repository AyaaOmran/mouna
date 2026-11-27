# Deployment, CI/CD, and Production Operations

Parent skill: `nestjs-universe`
Scope: GitHub Actions CI/CD pipelines, multi-stage Node LTS Dockerfiles, immutable image tagging, runtime secret/env validation, pre-rollout DB migrations, Terminus liveness vs readiness probes, graceful shutdown, zero-downtime rollout strategies, and rollback safety. Excludes ORM migration authoring internals and raw PostgreSQL DBA tuning.
Applies to: `Dockerfile`, `.dockerignore`, `.github/workflows/*.yml`, `k8s/*.yaml`, `scripts/deploy.sh`, `src/main.ts`, `src/health/*.ts`

## Contents

- [Order CI Checks Cheapest-First with Deterministic Lockfile Installs](#order-ci-checks-cheapest-first-with-deterministic-lockfile-installs-high)
- [Package Immutable Multi-Stage Node LTS Images with Non-Root Exec CMD](#package-immutable-multi-stage-node-lts-images-with-non-root-exec-cmd-high)
- [Run Database Migrations Once as a Pre-Rollout Job](#run-database-migrations-once-as-a-pre-rollout-job-critical)
- [Separate Liveness Probes from Dependency Readiness Checks](#separate-liveness-probes-from-dependency-readiness-checks-critical)
- [Enable Graceful Shutdown Hooks for Zero-Downtime Draining](#enable-graceful-shutdown-hooks-for-zero-downtime-draining-critical)
- [Match Rollout Strategy to Risk and Verify with Smoke Tests](#match-rollout-strategy-to-risk-and-verify-with-smoke-tests-medium)
- [Restore First and Never Panic-Run Destructive Down Migrations](#restore-first-and-never-panic-run-destructive-down-migrations-critical)

### Order CI Checks Cheapest-First with Deterministic Lockfile Installs [HIGH]

**Rule:** Run GitHub Actions on `pull_request` and `push` to `main` with `concurrency` (`cancel-in-progress: true`) and job `timeout-minutes`. Install with `npm ci` and cache `~/.npm` keyed on `package-lock.json` (via `actions/setup-node` `cache: npm` — never hash `package.json` or cache `node_modules`). Execute fast check-only scripts (`format:check`, `lint:check`, typecheck/`build`, unit tests) before starting a Postgres `services:` integration job matching the production major version (`needs: checks`). Never run `--fix` or set `continue-on-error: true` on quality gates.

**Why:** `--fix` mutates throwaway runner files and reports green on dirty code, `continue-on-error: true` hides test failures, and running `tsc --noEmit` / `npm run build` catches type errors that `isolatedModules` test runners skip.

```yaml
# ❌ Incorrect: auto-fixes in CI, masks failures, starts DB before compile check
- run: npm run lint
- run: npm test
  continue-on-error: true

# ✅ Correct: fail-fast check-only steps + lockfile cache + gated Postgres service job
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<latest-major>
      - uses: actions/setup-node@<latest-major>
        with: { node-version-file: '.nvmrc', cache: npm }
      - run: npm ci && npm run format:check && npm run lint:check && npm run build && npm test
  integration:
    needs: checks
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:<major>
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: app_test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s
```

### Package Immutable Multi-Stage Node LTS Images with Non-Root Exec CMD [HIGH]

**Rule:** Build one immutable image per commit in CI using a multi-stage `node:<lts>-alpine` `Dockerfile` (matching the repo's Node LTS) and `.dockerignore` (`node_modules`, `dist`, `coverage`, `.git`, `.env*`). Copy `package*.json` and run `npm ci` before `COPY . .`, prune dev packages (`npm prune --omit=dev`), copy `package.json`, `dist/`, and `node_modules/` into the runtime stage, switch to `USER node`, and start Node with exec-form `CMD ["node", "dist/main.js"]`. Inject secrets at runtime only (never in `Dockerfile` `ENV`/`ARG` or committed `.env*`), and deploy only immutable `sha-<commit>` or SemVer tags — never `:latest`.

**Why:** Copying source before `npm ci` busts the layer cache on every edit; omitting `package.json` in the runtime stage breaks Node ESM (`"type": "module"`) resolution and `npm run migration:run`; shell-form `CMD npm start` swallows `SIGTERM`; moving `:latest` tags can promote an untested commit when two PRs merge close together.

```dockerfile
# ❌ Incorrect: copies .env/node_modules, busts cache, ships devDeps as root
FROM node:<lts>-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
CMD npm run start:prod

# ✅ Correct: cached deps, pruned runtime stage, non-root, exec-form SIGTERM
FROM node:<lts>-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:<lts>-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
```

### Run Database Migrations Once as a Pre-Rollout Job [CRITICAL]

**Rule:** Run `npm run migration:run` exactly once from the new container image as a pre-rollout step (e.g., a Kubernetes Job or pre-deploy release task inside the deployment network) before updating application pods — never inside `AppModule` or `main.ts` boot (`migrationsRun: true`). Ensure every migration stays compatible with both the currently serving release and the incoming release (expand-and-contract).

**Why:** Running migrations on app startup causes concurrent replicas to race on schema locks, and incompatible migrations (in-place `RENAME COLUMN` or dropping live columns) break serving pods immediately during rollout and block code rollbacks.

```ts
// ❌ Incorrect: auto-migrating on every pod boot inside NestJS bootstrap
TypeOrmModule.forRoot({ type: 'postgres', url, migrationsRun: true }); // races across N replicas

// ✅ Correct: keep migrationsRun disabled in app code; execute once pre-rollout
TypeOrmModule.forRoot({ type: 'postgres', url, synchronize: false, migrationsRun: false });
// Run `npm run migration:run` once from the target release image before rolling pods
```

### Separate Liveness Probes from Dependency Readiness Checks [CRITICAL]

**Rule:** Expose a process-only liveness route (`GET /health/live` returning `200` with zero DB/Redis calls) and a separate readiness route (`GET /health`) using `@nestjs/terminus` (`TypeOrmHealthIndicator.pingCheck('database')`). Mark both `@Public()` when a global `APP_GUARD` is active.

**Why:** A `livenessProbe` that checks PostgreSQL turns a 60-second DB restart into simultaneous pod kills and `CrashLoopBackOff` across every replica; failing `readinessProbe` only pauses traffic until the DB recovers.

```ts
// ❌ Incorrect: pointing Kubernetes livenessProbe at a DB ping endpoint
// livenessProbe: { httpGet: { path: /health, port: 3000 } }

// ✅ Correct: liveness checks process only; readiness checks DB via Terminus
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get('live')
  live() { return { status: 'ok' }; }

  @Public()
  @Get()
  @HealthCheck()
  ready() { return this.health.check([() => this.db.pingCheck('database')]); }
}
```

### Enable Graceful Shutdown Hooks for Zero-Downtime Draining [CRITICAL]

**Rule:** Call `app.enableShutdownHooks()` in `src/main.ts` and implement `OnApplicationShutdown` on providers holding custom connections or workers. Pair this with exec-form `CMD ["node", "dist/main.js"]` (and a short K8s `preStop` sleep when needed for load-balancer deregistration).

**Why:** Without shutdown hooks and direct `SIGTERM` delivery, rolling deploys terminate containers with in-flight HTTP requests open, causing intermittent 502/reset errors on every release.

```ts
// ❌ Incorrect: ignores SIGTERM; K8s kills open requests at grace timeout
const app = await NestFactory.create(AppModule);
await app.listen(config.getOrThrow<number>('PORT'));

// ✅ Correct: drains HTTP server and invokes OnApplicationShutdown hooks
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.listen(config.getOrThrow<number>('PORT'));
```

### Match Rollout Strategy to Risk and Verify with Smoke Tests [MEDIUM]

**Rule:** Require at least 2 replicas, readiness probes, graceful shutdown, and backward-compatible schema changes for zero-downtime releases. Pick the rollout strategy by blast radius and run automated post-deploy smoke checks (`/health`, `/version`, and one core read route) before marking a deploy successful.

| Strategy | Traffic Pattern | Rollback Speed | When to Use |
| :--- | :--- | :--- | :--- |
| **RollingUpdate** (`maxSurge: 1`, `maxUnavailable: 0`) | Replaces pods incrementally | Minutes (`rollout undo`) | Everyday default for compatible releases |
| **Blue-Green** | Instant router cutover between 2 full stacks | Seconds (switch back) | High-stakes releases needing instant revert |
| **Canary** (`5% -> 25% -> 50% -> 100%`) | Weighted slice compared on 5xx, p95/p99, business KPIs | Seconds (canary to `0%`) | Risky logic (e.g., pricing) on high traffic |

```bash
# ✅ Correct: verify readiness, deployed commit SHA, and core journey after rollout
curl --fail --retry 10 --retry-delay 5 --retry-all-errors "$BASE_URL/health"
curl --fail -s "$BASE_URL/version" | grep -q "$EXPECTED_SHA"
curl --fail "$BASE_URL/v1/jobs"
```

### Restore First and Never Panic-Run Destructive Down Migrations [CRITICAL]

**Rule:** Agree on numeric abort thresholds before deploying (e.g., 5xx error rate above 1% for 5 minutes) and pick one of the 4 recovery paths: **Roll back** image (`kubectl rollout undo` or previous `sha-`), **Switch back** traffic (Blue-Green / Canary `0%`), **Toggle feature flag**, or **Roll forward** with a small fix. Restore user traffic before debugging, and never panic-run destructive `down` migrations in production.

**Why:** Old container images are immutable and safe to redeploy, but a `down` migration drops columns or tables containing rows written after the release — roll back code, roll forward data with a new compatible migration.

```bash
# ❌ Incorrect: panic-reverts schema and deletes rows written since the release
npm run migration:revert

# ✅ Correct: restore traffic first with previous immutable image, then fix data forward
kubectl rollout undo deployment/api
kubectl rollout status deployment/api --timeout=180s
```
