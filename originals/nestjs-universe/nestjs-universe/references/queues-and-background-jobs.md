# Queues & Background Jobs (BullMQ & Scheduling)

> **Parent skill:** `nestjs-universe`
> **Scope:** Offloading background work in NestJS with `@nestjs/bullmq`, Redis durability, `@nestjs/schedule` cron-to-queue triggers, retries/backoff, idempotent workers, DLQ/poison-message triage, workload isolation, Bull Board auth, and BullMQ vs. EDA selection. Excludes multi-service event streaming (use Kafka/EDA).
> **Applies to:** `*.processor.ts`, `*.scheduler.ts`, `*.module.ts`, `*.service.ts`, `main.ts` using `@nestjs/bullmq`, `bullmq`, `@nestjs/schedule`, `@bull-board/api`, `@bull-board/express`.

## Contents

- [Decide Sync vs. Async & Communicate Honest Contracts](#decide-sync-vs-async--communicate-honest-contracts-high)
- [Use `@nestjs/bullmq` `WorkerHost`, Shared Queue Constants, and Persistent Redis](#use-nestjsbullmq-workerhost-shared-queue-constants-and-persistent-redis-high)
- [Pass ID-Only Payloads and Fetch Fresh DB State](#pass-id-only-payloads-and-fetch-fresh-db-state-high)
- [Keep `@Cron` Schedulers Thin — Enqueue Only](#keep-cron-schedulers-thin--enqueue-only-high)
- [Pair `attempts` with Exponential Backoff](#pair-attempts-with-exponential-backoff-high)
- [Catch, Log, and Re-Throw Worker Errors](#catch-log-and-re-throw-worker-errors-critical)
- [Make Workers Idempotent Using `job.id`](#make-workers-idempotent-using-jobid-critical)
- [Treat the `failed` Set as DLQ & Handle Backpressure, Poison Messages, and Ordering](#treat-the-failed-set-as-dlq--handle-backpressure-poison-messages-and-ordering-high)
- [Isolate Queues by Workload & Guard Bull Board](#isolate-queues-by-workload--guard-bull-board-high)
- [Choose BullMQ vs. Event-Driven Architecture](#choose-bullmq-vs-event-driven-architecture-medium)

---

### Decide Sync vs. Async & Communicate Honest Contracts [HIGH]

- **Rule:** Keep work synchronous if the caller needs the result immediately (payments, auth, inventory checks). Defer side effects and heavy work (emails, PDFs, third-party webhooks) to a queue when a **60-second delay** is acceptable. Return an honest `201`/`202` payload reflecting what actually finished synchronously ("task created; notification enqueued"), never claiming async work already completed.
- **Why:** Slow or failing external providers stall HTTP threads and break core mutations; misleading API contracts cause frontends to display false "email delivered" confirmations during eventual consistency windows.

```ts
// ❌ Incorrect: blocks HTTP request on 8s SMTP call and fails signup if provider is down
const task = await this.tasksRepo.save(dto);
await this.mailer.sendTaskEmail(task.id);
return { task, message: 'Email delivered' };

// ✅ Correct: persist first, enqueue non-blocking job, return honest contract
const task = await this.tasksRepo.save(dto);
await this.notificationsQueue.add('task-created', { taskId: task.id });
return { task, notificationStatus: 'enqueued' };
```

---

### Use `@nestjs/bullmq` `WorkerHost`, Shared Queue Constants, and Persistent Redis [HIGH]

- **Rule:** Always install `@nestjs/bullmq` + `bullmq` (NEVER legacy `@nestjs/bull`). Extend `WorkerHost` with `@Processor(QUEUE_NAME)` and share one exported constant across `BullModule.registerQueue({ name })`, `@InjectQueue(name)`, and `@Processor(name)`. Configure Redis with **AOF or RDB persistence** in production (`appendonly yes`), never cache-only volatile memory.
- **Why:** `@nestjs/bull` targets deprecated Bull v3. A single typo between `'notifications'` and `'notification'` silently leaves jobs unprocessed forever with zero error. Volatile Redis wipes queued jobs on restart.

```ts
// ❌ Incorrect: legacy @nestjs/bull + raw mismatched string literals
@InjectQueue('notifications') private queue: Queue;
@Processor('notification') // typo: jobs sit in Redis forever

// ✅ Correct: shared constant + @nestjs/bullmq WorkerHost
export const NOTIFICATIONS_QUEUE = 'notifications';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job<{ taskId: string }>): Promise<void> { /* ... */ }
}
```

---

### Pass ID-Only Payloads and Fetch Fresh DB State [HIGH]

- **Rule:** Put only immutable entity IDs (e.g., `{ taskId: task.id }`) in `queue.add()` payloads and load fresh state inside the worker from the database.
- **Why:** Queued jobs may execute minutes later during backpressure or retries; full serialized entities become stale, bloat Redis memory, and leak PII into Redis/Bull Board logs.

```ts
// ❌ Incorrect: full mutable entity baked into Redis payload
await this.notificationsQueue.add('task-created', { task, user });

// ✅ Correct: minimal ID payload; worker reloads authoritative state
await this.notificationsQueue.add('task-created', { taskId: task.id });
// Inside worker: const task = await this.tasksRepo.findOneBy({ id: job.data.taskId });
```

---

### Keep `@Cron` Schedulers Thin — Enqueue Only [HIGH]

- **Rule:** Never execute business logic directly inside `@nestjs/schedule` `@Cron` handlers. Keep `@Cron` methods as one-liners that enqueue a BullMQ job with a deterministic `jobId` (e.g., per day/window) — or use BullMQ Job Schedulers / repeatable jobs — so BullMQ owns retries, durability, and single execution across replicas.
- **Why:** `@nestjs/schedule` runs in-process with zero durability or retries; in a 3-replica deployment, `@Cron` fires 3 times simultaneously, causing duplicate invoices/reports unless deduplicated via BullMQ.

```ts
// ❌ Incorrect: runs directly on all 3 pods, no retry on crash
@Cron(CronExpression.EVERY_DAY_AT_9AM)
async runDailyInvoices() { await this.billing.generateAllInvoices(); }

// ✅ Correct: thin trigger with date-scoped jobId deduplicates across replicas
@Cron(CronExpression.EVERY_DAY_AT_9AM)
async scheduleDailyInvoices() {
  const day = new Date().toISOString().slice(0, 10);
  await this.reportsQueue.add('daily-invoices', { day }, { jobId: `daily-invoices-${day}` });
}
```

---

### Pair `attempts` with Exponential Backoff [HIGH]

- **Rule:** Always configure `attempts` together with `backoff: { type: 'exponential', delay: 1000 }` (either on `queue.add()` or centrally in `BullModule.registerQueue({ name, defaultJobOptions })`). Never set `attempts` without `backoff`.
- **Why:** Retrying without backoff fires all attempts within milliseconds against an overloaded dependency, guaranteeing failure and amplifying outages. Exponential backoff spaces retries (`1s -> 2s -> 4s`).

```ts
// ❌ Incorrect: 3 instant retries hammer a failing SMTP server in <50ms
await this.notificationsQueue.add('task-created', { taskId }, { attempts: 3 });

// ✅ Correct: queue-wide defaultJobOptions with exponential backoff
BullModule.registerQueue({
  name: NOTIFICATIONS_QUEUE,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});
```

---

### Catch, Log, and Re-Throw Worker Errors [CRITICAL]

- **Rule:** NEVER catch an exception in `WorkerHost.process()` and return normally. Always log context (`job.id`, `job.attemptsMade`) and **re-throw** the error so BullMQ marks the attempt failed and schedules retries.
- **Why:** If `process()` resolves without throwing, BullMQ marks the job `completed`. Retries never fire, the job never reaches the `failed` set, and work silently vanishes.

```ts
// ❌ Incorrect: swallowed exception -> BullMQ marks job COMPLETED
async process(job: Job<{ taskId: string }>): Promise<void> {
  try { await this.mailer.sendTaskEmail(job.data.taskId); }
  catch (err) { this.logger.error(err); }
}

// ✅ Correct: catch to log job.id + job.attemptsMade, then re-throw
async process(job: Job<{ taskId: string }>): Promise<void> {
  try {
    await this.mailer.sendTaskEmail(job.data.taskId);
  } catch (err) {
    this.logger.error(`Job ${job.id} failed on attempt ${job.attemptsMade}`, err);
    throw err;
  }
}
```

---

### Make Workers Idempotent Using `job.id` [CRITICAL]

- **Rule:** Design every worker for **at-least-once delivery** using `job.id` as the idempotency key: (1) for external providers (Stripe, SendGrid), pass `job.id` as the provider's `Idempotency-Key`; (2) for database mutations, atomically `INSERT INTO processed_jobs(job_id UNIQUE) ... ON CONFLICT DO NOTHING` inside the **same database transaction** as the business write (never insert into `processed_jobs` before a fallible external API call, or retries will skip it).
- **Why:** If a worker executes a side effect and crashes before marking the job complete, BullMQ detects the stalled job and re-delivers it to another worker. Recording `processed_jobs` before an external call that throws permanently suppresses retries.

```ts
// ❌ Incorrect: no idempotency key (or marking processed_jobs before fallible SMTP call)
await this.mailer.sendTaskEmail(job.data.taskId);

// ✅ Correct: provider idempotencyKey for external APIs; atomic tx dedup for DB writes
await this.mailer.sendTaskEmail(job.data.taskId, { idempotencyKey: job.id });
```

---

### Treat the `failed` Set as DLQ & Handle Backpressure, Poison Messages, and Ordering [HIGH]

- **Rule:** Monitor BullMQ's `failed` set as your Dead-Letter Queue (alert on growth; inspect, fix, and replay — never auto-delete failed jobs with `removeOnFail: true`). Distinguish transient failures (network/5xx -> retry) from **poison messages** (invalid payload/email -> throw `UnrecoverableError` from `bullmq` to skip futile retries). On backpressure, identify the true bottleneck (external rate limit, DB, CPU) before adding workers. Never assume enqueue order equals completion order across concurrent workers.
- **Why:** Adding 20 workers against a 100 req/min provider limit increases 429s instead of throughput; retrying malformed data wastes worker slots; parallel workers finish jobs in variable durations, breaking ordered state transitions (e.g., balance deltas).

```ts
// ❌ Incorrect: retries malformed payload 10 times, clogging worker pool
if (!isValidEmail(user.email)) throw new Error('Invalid email');

// ✅ Correct: fail fast to DLQ (failed set) without burning retry attempts
import { UnrecoverableError } from 'bullmq';
if (!isValidEmail(user.email)) throw new UnrecoverableError('Invalid email');
```

---

### Isolate Queues by Workload & Guard Bull Board [HIGH]

- **Rule:** Separate I/O-bound queues (`notifications`, higher concurrency) from CPU-intensive queues (`pdf-reports`, low concurrency / separate worker process). Always mount `@bull-board/express` (`/admin/queues`) behind authentication/admin middleware or internal-network restriction — it ships with zero auth by default.
- **Why:** Running 50 CPU-heavy PDF jobs on the same pool saturates the Node event loop and starves fast HTTP and email workers. Unprotected `/admin/queues` exposes payloads and lets anyone pause queues or delete jobs.

```ts
// ❌ Incorrect: public Bull Board + single shared queue for emails & PDFs
app.use('/admin/queues', serverAdapter.getRouter());

// ✅ Correct: auth-protected Bull Board with dedicated queues per workload
const notifQueue = app.get<Queue>(getQueueToken(NOTIFICATIONS_QUEUE));
const reportsQueue = app.get<Queue>(getQueueToken(REPORTS_QUEUE));
createBullBoard({ queues: [new BullMQAdapter(notifQueue), new BullMQAdapter(reportsQueue)], serverAdapter });
app.use('/admin/queues', adminBasicAuthMiddleware, serverAdapter.getRouter());
```

---

### Choose BullMQ vs. Event-Driven Architecture [MEDIUM]

- **Rule:** Use BullMQ for **competing-consumer** background jobs inside one application; use a Pub/Sub message broker (Kafka / RabbitMQ) when multiple independent services must each receive a copy of the same domain event. Never assume multiple BullMQ workers on one queue broadcast to all workers.

| Dimension | BullMQ (`@nestjs/bullmq`) | EDA Broker (Kafka / RabbitMQ) |
| :--- | :--- | :--- |
| Delivery model | Competing consumers (one worker gets each job) | Pub/Sub fan-out (every consumer group gets a copy) |
| Producer coupling | Knows job name & target queue | Publishes past-tense fact; ignores subscribers |
| Built-in strengths | Delays, cron/repeatable jobs, backoff, Bull Board | Multi-service fan-out, replayable log (Kafka), routing |
| Best fit | Welcome emails, PDFs, daily reports inside one app | `order.placed` -> payments + loyalty + analytics |
