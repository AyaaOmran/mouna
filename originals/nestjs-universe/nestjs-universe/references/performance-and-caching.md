# Performance & Caching

> **Parent skill:** `nestjs-universe`
> **Scope:** NestJS API profiling, ORM query optimization, N+1 elimination, bounded pagination & sort whitelisting, `ioredis` cache-aside & invalidation, API payload hygiene, and distributed `@nestjs/throttler` rate limiting. For raw PostgreSQL query-planner internals, autovacuum, or PgBouncer tuning, defer to `supabase-postgres-best-practices`.
> **Applies to:** NestJS backends (`*.service.ts`, `*.controller.ts`, `*.interceptor.ts`, `redis.*`, `cache.*`, `app.module.ts`).

## Contents

- [Follow the 5-Step Measure-First Performance Loop](#follow-the-5-step-measure-first-performance-loop-high)
- [Keep Indexed Columns Bare in WHERE Clauses](#keep-indexed-columns-bare-in-where-clauses-critical)
- [Eliminate ORM N+1 Queries Without Eager Relations or Loop Queries](#eliminate-orm-n1-queries-without-eager-relations-or-loop-queries-critical)
- [Enforce Bounded Pagination, Tie-Breakers, and Sort Whitelists](#enforce-bounded-pagination-tie-breakers-and-sort-whitelists-critical)
- [Connect Redis via a Global Symbol Module with Fast Failover](#connect-redis-via-a-global-symbol-module-with-fast-failover-high)
- [Implement Fail-Open Cache-Aside with Jitter and Stampede Locking](#implement-fail-open-cache-aside-with-jitter-and-stampede-locking-high)
- [Scope Cache Keys by Every Input and Invalidate DB-First](#scope-cache-keys-by-every-input-and-invalidate-db-first-critical)
- [Share Rate-Limit State in Redis Behind Load Balancers](#share-rate-limit-state-in-redis-behind-load-balancers-high)

---

### Follow the 5-Step Measure-First Performance Loop [HIGH]

**Rule:** Optimize strictly via **Reproduce -> Measure -> Find -> Fix -> Verify** on realistic row counts. Track **p95 and p99** latency (never averages alone). Instrument NestJS with a `TimingInterceptor` using RxJS `finalize`, enable TypeORM `maxQueryExecutionTime: 200`, inspect `pg_stat_statements` sorted by `total_exec_time`, and benchmark one change at a time after warm-up with `autocannon -c 50 -d 20 <url>`.

**Why:** Fixing a 30 ms step inside a 900 ms request changes almost nothing; averages hide tail-latency spikes affecting real users.

```ts
// ❌ Incorrect — guessing without measuring, or only timing happy paths via tap()
// ✅ Correct — TimingInterceptor logs both successes and slow errors
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const start = performance.now();
    return next.handle().pipe(
      finalize(() => Logger.log(`${req.method} ${req.url} ${Math.round(performance.now() - start)}ms`, 'HTTP')),
    );
  }
}
```

---

### Keep Indexed Columns Bare in WHERE Clauses [CRITICAL]

**Rule:** In `WHERE` clauses, keep indexed columns bare — do not wrap them in functions like `LOWER(email)` or `DATE(created_at)` unless a matching expression index or `citext` column exists. Always filter and aggregate inside PostgreSQL rather than loading full tables into Node memory.

**Why:** Wrapping an indexed column in a function prevents PostgreSQL from using the B-tree index and forces a Sequential Scan.

```ts
// ❌ Incorrect — function on indexed column disables B-tree index on created_at
// WHERE DATE(created_at) = '2026-05-01'

// ✅ Correct — sargable range predicate on bare indexed column
const todayCount = await this.orders.count({
  where: { status: 'paid', createdAt: Between(dayStart, dayEnd) },
});
```

---

### Eliminate ORM N+1 Queries Without Eager Relations or Loop Queries [CRITICAL]

**Rule:** Never enable `eager: true` on entity relations, and never run database queries inside a loop — even wrapped in `Promise.all(rows.map(...))`. Load to-one associations with explicit `relations` JOINs, batch to-many lookups with `In(ids)` + a `Map`, and compute per-parent counts with a single SQL `GROUP BY`.

**Why:** `eager: true` forces unwanted joins on every query across the app; `Promise.all` over loop queries still executes N+1 round-trips and saturates the Postgres connection pool.

```ts
// ❌ Incorrect — N+1 loop (Promise.all still fires N queries and starves the pool)
const enriched = await Promise.all(
  orders.map(async (o) => ({ ...o, customer: await this.customers.findOneBy({ id: o.customerId }) })),
);

// ✅ Correct — 2 queries total via In(ids) batching + O(1) Map join
const ids = [...new Set(orders.map((o) => o.customerId))];
const customers = ids.length ? await this.customers.findBy({ id: In(ids) }) : [];
const byId = new Map(customers.map((c) => [c.id, c]));
const enriched = orders.map((o) => ({ ...o, customer: byId.get(o.customerId) ?? null }));
```

---

### Enforce Bounded Pagination, Tie-Breakers, and Sort Whitelists [CRITICAL]

**Rule:** Never ship unbounded list endpoints; enforce a capped `limit` in a validated Query DTO. Use **cursor (keyset) pagination** (`take: limit + 1`) for feeds and large/changing datasets — ensuring the cursor predicate matches the **exact** `ORDER BY` column(s) — and reserve offset pagination (`findAndCount`) for bounded admin tables. Always append `id` as a deterministic `ORDER BY` tie-breaker, and map client `sort` values through a strict `const` whitelist (never interpolate `req.query.sort` into `orderBy`).

**Why:** Unbounded lists OOM the server; missing `id` tie-breakers duplicate or drop rows across pages; mismatching the cursor column with `ORDER BY` skips rows; raw `req.query.sort` enables SQL injection or unindexed sorts.

```ts
// ❌ Incorrect — raw sort interpolation + no tie-breaker + unbounded query
qb.orderBy(`order.${query.sort}`, 'DESC').getMany();

// ✅ Correct — whitelisted sort + deterministic id tie-breaker + capped page
const SORT_COLS = { createdAt: 'createdAt', total: 'total' } as const;
const sortCol = SORT_COLS[query.sort ?? 'createdAt'];
const [data, total] = await this.orders.findAndCount({
  order: { [sortCol]: 'DESC', id: 'DESC' },
  skip: (query.page - 1) * query.limit,
  take: query.limit,
});
```

---

### Connect Redis via a Global Symbol Module with Fast Failover [HIGH]

**Rule:** Create one shared `ioredis` client inside a `@Global()` `RedisModule` exported under a `Symbol('REDIS')` token, configure `enableOfflineQueue: false` (or low `maxRetriesPerRequest`) so commands fail fast during outages, and call `await this.redis.quit()` in `OnApplicationShutdown`. Name keys hierarchically (`menu:item:7`) and iterate key patterns with `SCAN` rather than blocking `KEYS *`.

**Why:** Without `enableOfflineQueue: false`, requests hang indefinitely while Redis is down; omitting `quit()` leaks sockets during graceful shutdown; `KEYS *` stalls Redis's single-threaded event loop.

```ts
// ❌ Incorrect — queues commands forever on outage + blocks Redis with KEYS *
const redis = new Redis(cfg.url);
const keys = await redis.keys('menu:*');

// ✅ Correct — global Symbol token + fast-fail client + non-blocking SCAN
export const REDIS = Symbol('REDIS');
// provider: { provide: REDIS, useFactory: (cfg) => new Redis(cfg.url, { enableOfflineQueue: false }) }
let cursor = '0';
do {
  const [next, batch] = await this.redis.scan(cursor, 'MATCH', 'menu:*', 'COUNT', 100);
  if (batch.length) await this.redis.del(...batch);
  cursor = next;
} while (cursor !== '0');
```

---

### Implement Fail-Open Cache-Aside with Jitter and Stampede Locking [HIGH]

**Rule:** Wrap cache reads/writes in a **fail-open** helper (`getOrSet`) that logs Redis errors and falls back to PostgreSQL without failing the request. Add random TTL jitter (`ttl + Math.floor(Math.random() * 60)`) so keys do not expire simultaneously, and protect hot/expensive keys against thundering-herd stampedes with a short mutex (`SET lock:<key> 1 NX EX 10`).

**Why:** A Redis restart must degrade latency, not return 500s; synchronized expirations unleash hundreds of concurrent rebuild queries onto PostgreSQL.

```ts
// ❌ Incorrect — crashes on Redis outage + synchronized TTL expiry
const cached = await this.redis.get(key); // throws if Redis down
await this.redis.set(key, JSON.stringify(val), 'EX', 300);

// ✅ Correct — fail-open cache-aside + jittered TTL + fire-and-forget write
async getOrSet<T>(key: string, baseTtl: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await this.redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch { this.logger.warn(`cache read failed: ${key}`); }
  const value = await load();
  const ttl = baseTtl + Math.floor(Math.random() * 60);
  this.redis.set(key, JSON.stringify(value), 'EX', ttl).catch(() => this.logger.warn(`cache write failed: ${key}`));
  return value;
}
```

---

### Scope Cache Keys by Every Input and Invalidate DB-First [CRITICAL]

**Rule:** Include **every** varying input (`userId`, tenant, filter, cursor, sort) in the cache key — never use a global key like `orders:me` for user-scoped endpoints. On writes, commit to PostgreSQL **first**, then `DEL` the cache key (never `DEL` before `UPDATE`). Always enforce **"show from cache, decide from DB"**: never read prices, inventory, or permissions from cache inside checkout/write transactions.

**Why:** A shared `orders:me` key leaks User A's data to User B; deleting cache before DB update lets a concurrent reader re-populate stale pre-update data; stale cached prices charge the wrong amount.

```ts
// ❌ Incorrect — cross-user data leak + cache-first invalidation + cached price at checkout
const list = await this.cache.getOrSet('orders:me', 300, () => this.orders.findBy({ userId }));
await this.redis.del('menu:all');
await this.menu.update(id, dto);

// ✅ Correct — user+input scoped key + DB-first then DEL + fresh DB read inside tx
const key = `orders:user:${userId}:cursor:${cursor ?? 'first'}:limit:${limit}`;
await this.menu.update(id, dto);
await this.redis.del('menu:all');
// Checkout: query MenuItem via tx manager.getRepository(MenuItem).findBy({ id: In(ids) })
```

---

### Share Rate-Limit State in Redis Behind Load Balancers [HIGH]

**Rule:** Register `@nestjs/throttler` (`APP_GUARD` -> `ThrottlerGuard`) backed by a shared **Redis storage** adapter whenever running multiple replicas. Apply tighter `@Throttle({ default: { limit: 5, ttl: 60_000 } })` limits to auth/login routes, return `429 Too Many Requests` with `Retry-After`, and explicitly choose **fail-open** (public catalog/read endpoints) vs **fail-closed** (login, password reset, payments) if Redis is unreachable.

**Why:** Default in-memory throttler storage multiplies the effective rate limit by the replica count and resets on every deploy.

```ts
// ❌ Incorrect — default in-memory storage splits counters across 3 replicas
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]);

// ✅ Correct — shared Redis storage + strict auth route limit
ThrottlerModule.forRootAsync({
  inject: [REDIS],
  useFactory: (redis: Redis) => ({
    throttlers: [{ ttl: 60_000, limit: 100 }],
    storage: new ThrottlerStorageRedisService(redis),
  }),
});
// On AuthController.login: @Throttle({ default: { limit: 5, ttl: 60_000 } })
```
