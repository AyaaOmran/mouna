# Kafka & Event-Driven Architecture (NestJS)

> **Parent skill:** `nestjs-universe`
> **Scope:** Apache Kafka (KRaft) producers and consumers in NestJS (`@nestjs/microservices` `Transport.KAFKA` + `kafkajs`), versioned event contracts, partition-key ordering, consumer-group naming/scaling, durability (`acks`, `idempotent`), manual `offset + 1` commits, transactional idempotent consumers, DLQ handling, and inline Transactional Outbox. Excludes single-app Redis job queues (use BullMQ).
> **Applies to:** `*.module.ts`, `*.service.ts`, `*.controller.ts`, `main.ts`, `*.event.ts` using `@nestjs/microservices`, `kafkajs`.

## Contents

- [Run KRaft Brokers & Configure `producerOnlyMode` + `lastValueFrom`](#run-kraft-brokers--configure-produceronlymode--lastvaluefrom-high)
- [Model Small, Versioned Past-Tense Events — Not Commands](#model-small-versioned-past-tense-events--not-commands-high)
- [Key Messages by Entity ID & Size Partitions Up Front](#key-messages-by-entity-id--size-partitions-up-front-high)
- [Account for NestJS `<groupId>-server` Suffix & Avoid Watch-Mode Collisions](#account-for-nestjs-groupid-server-suffix--avoid-watch-mode-collisions-high)
- [Configure Producer Durability (`acks: -1`, `idempotent: true`)](#configure-producer-durability-acks--1-idempotent-true-high)
- [Commit `offset + 1` in Manual-Commit Consumers](#commit-offset--1-in-manual-commit-consumers-critical)
- [Deduplicate Consumers Atomically with `processed_events`](#deduplicate-consumers-atomically-with-processed_events-critical)
- [Bound Retries and Route Poison Messages to a DLQ Topic](#bound-retries-and-route-poison-messages-to-a-dlq-topic-critical)
- [Prevent Dual-Write Loss with Transactional Outbox](#prevent-dual-write-loss-with-transactional-outbox-critical)

---

### Run KRaft Brokers & Configure `producerOnlyMode` + `lastValueFrom` [HIGH]

- **Rule:** Run Kafka in **KRaft mode** (do not deploy legacy ZooKeeper). On services that only publish events, set `producerOnlyMode: true` in `ClientsModule.registerAsync()` (`Transport.KAFKA`), connect in `onModuleInit()`, and wrap `this.kafka.emit()` in `await lastValueFrom(...)`.
- **Why:** Without `producerOnlyMode: true`, a producer-only NestJS service joins a consumer group and triggers useless rebalances. `emit()` returns a cold RxJS `Observable` — forgetting `lastValueFrom()` silently drops sends or swallows broker errors.

```ts
// ❌ Incorrect: joins a phantom consumer group and ignores emit() Observable
ClientsModule.register([{ name: 'KAFKA_CLIENT', transport: Transport.KAFKA, options: { client } }]);
this.kafka.emit('order.placed', { key: order.id, value: event }); // unsubscribed or unawaited

// ✅ Correct: producerOnlyMode + explicit connect + awaited lastValueFrom
ClientsModule.register([{
  name: 'KAFKA_CLIENT',
  transport: Transport.KAFKA,
  options: { client: { clientId: 'orders', brokers }, producerOnlyMode: true },
}]);
await lastValueFrom(this.kafka.emit('order.placed', { key: order.id, value: event }));
```

---

### Model Small, Versioned Past-Tense Events — Not Commands [HIGH]

- **Rule:** Name topics/events as **past-tense facts** (`order.placed`, `payment.completed`), never imperative commands disguised as events (`send.welcome.email`). Keep JSON values under Kafka's `1 MB` default limit (IDs and facts, never files), serialize dates as ISO-8601 strings, and always include a unique `eventId` (UUID) and numeric `version`.
- **Why:** Imperative commands tightly couple producers to one receiver's behavior. Missing `eventId` breaks consumer idempotency; missing `version` breaks rolling upgrades when schemas evolve.

```ts
// ❌ Incorrect: command name, raw Date object, no eventId or version
export interface SendWelcomeEmail { order: FullOrderWithBlobs; createdAt: Date; }

// ✅ Correct: compact, versioned past-tense event contract
export interface OrderPlacedEvent {
  eventId: string;    // randomUUID() — idempotency key
  orderId: string;    // also used as Kafka partition key
  customerId: string;
  total: number;
  placedAt: string;   // ISO-8601 UTC string
  version: 1;
}
```

---

### Key Messages by Entity ID & Size Partitions Up Front [HIGH]

- **Rule:** Pass the entity identifier (e.g., `key: order.id`) whenever events for the same entity must stay ordered. Plan topic partition counts up front to match future peak consumer parallelism (max active consumers in a group equals the partition count).
- **Why:** Kafka guarantees ordering **only within a single partition**. Unkeyed `created`/`paid`/`shipped` events scatter across partitions and arrive out of order. Increasing partitions later changes `hash(key) % N`, routing existing keys to new partitions and temporarily breaking per-entity order.

```ts
// ❌ Incorrect: no key -> created/paid/shipped land on different partitions
await lastValueFrom(this.kafka.emit('order.events', event));

// ✅ Correct: entity ID key guarantees same partition and strict per-order sequence
await lastValueFrom(this.kafka.emit('order.events', { key: order.id, value: event }));
```

---

### Account for NestJS `<groupId>-server` Suffix & Avoid Watch-Mode Collisions [HIGH]

- **Rule:** Remember NestJS automatically appends `-server` to `consumer.groupId` (e.g., `groupId: 'loyalty'` registers as `loyalty-server` in Kafka CLI tools, lag monitors, and offset resets). When scaling multiple consumer instances locally, build once (`npm run build`) and launch `node dist/main` — NEVER run multiple `npm run start:dev` watch processes against the same `dist/` folder.
- **Why:** Running `kafka-consumer-groups.sh --describe --group loyalty` shows an empty/missing group while `loyalty-server` holds the real lag. Parallel `start:dev` processes overwrite `dist/` simultaneously and crash with missing module errors.

```bash
# ❌ Incorrect: wrong group name and colliding watch-mode processes
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group loyalty
npm run start:dev & npm run start:dev

# ✅ Correct: NestJS appends -server; build once and run compiled output
npm run build && node dist/main
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group loyalty-server
```

---

### Configure Producer Durability (`acks: -1`, `idempotent: true`) [HIGH]

- **Rule:** For business-critical events, configure KafkaJS with `producer: { idempotent: true }` and `send: { acks: -1 }` (`acks = all`), paired with broker/topic `min.insync.replicas=2` (for replication factor 3).
- **Why:** `acks: 0` drops messages silently; `acks: 1` loses acknowledged messages if the leader fails before follower replication. Without `idempotent: true`, producer retries after a lost ack write duplicate records to the partition.

```ts
// ❌ Incorrect: leader-only ack with non-idempotent retries risks loss & broker duplicates
options: { client, producerOnlyMode: true, send: { acks: 1 } }

// ✅ Correct: all ISR acks + idempotent producer in NestJS Transport.KAFKA options
options: {
  client: { clientId: 'orders', brokers },
  producerOnlyMode: true,
  producer: { idempotent: true },
  send: { acks: -1 },
}
```

---

### Commit `offset + 1` in Manual-Commit Consumers [CRITICAL]

- **Rule:** When running with `run: { autoCommit: false }`, NEVER commit the raw `ctx.getMessage().offset`. Always compute **`(BigInt(ctx.getMessage().offset) + 1n).toString()`** (or `Number(...) + 1` for safe integers) and commit that next offset only after processing succeeds.
- **Why:** Kafka's committed offset stores the **next** offset to fetch on restart/rebalance. Committing raw offset `41` causes the consumer to re-read and re-process message `41` on every restart. (Offsets are strings in KafkaJS because 64-bit offsets can exceed JS safe integers.)

```ts
// ❌ Incorrect: commits raw offset 41 -> re-processes offset 41 after restart
await ctx.getConsumer().commitOffsets([
  { topic: ctx.getTopic(), partition: ctx.getPartition(), offset: ctx.getMessage().offset },
]);

// ✅ Correct: commit offset + 1 after work succeeds
const nextOffset = (BigInt(ctx.getMessage().offset) + 1n).toString();
await ctx.getConsumer().commitOffsets([
  { topic: ctx.getTopic(), partition: ctx.getPartition(), offset: nextOffset },
]);
```

---

### Deduplicate Consumers Atomically with `processed_events` [CRITICAL]

- **Rule:** Treat every Kafka consumer as **at-least-once** — Kafka `exactly-once` stops at Kafka's boundary and does NOT cover external DB writes, HTTP calls, or emails. Record `event.eventId` inside a `processed_events(event_id PRIMARY KEY)` table using `INSERT ... ON CONFLICT DO NOTHING` in the **exact same database transaction** as the business write.
- **Why:** Crashes between business work and offset commit, consumer rebalances, and outbox relay retries all redeliver events. Checking and inserting in separate queries races under concurrency; non-transactional inserts leave partial state on crash.

```ts
// ❌ Incorrect: non-atomic check or unprotected increment double-credits points on redelivery
await this.loyaltyRepo.increment({ customerId: event.customerId }, 'points', event.total);

// ✅ Correct: single DB transaction deduplicates eventId and applies mutation atomically
await this.dataSource.transaction(async (tx) => {
  const inserted = await tx.query(
    `INSERT INTO processed_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id`,
    [event.eventId],
  );
  if (inserted.length === 0) return;
  await tx.increment(LoyaltyAccount, { customerId: event.customerId }, 'points', event.total);
});
```

---

### Bound Retries and Route Poison Messages to a DLQ Topic [CRITICAL]

- **Rule:** Never let permanent errors escape unhandled from `@EventPattern()` handlers. Retry only transient failures with a short bounded backoff, then publish failed messages to `<topic>.dlq` preserving the original `key` and string/Buffer metadata headers (`error`, `source-offset`) via `await lastValueFrom(this.kafka.emit(...))`, and return normally so the offset advances.
- **Why:** Unhandled exceptions in NestJS Kafka event handlers are retried indefinitely without advancing the offset — a single malformed poison message freezes its entire partition and spikes consumer lag.

```ts
// ❌ Incorrect: unhandled permanent error stalls the whole partition forever
@EventPattern('order.placed')
async onOrderPlaced(@Payload() event: OrderPlacedEvent) {
  await this.payments.charge(event); // throws on bad payload -> infinite retry loop
}

// ✅ Correct: bounded transient retries, then emit to DLQ and let offset commit
@EventPattern('order.placed')
async onOrderPlaced(@Payload() event: OrderPlacedEvent, @Ctx() ctx: KafkaContext) {
  try {
    await retryTransient(() => this.payments.charge(event), { attempts: 3, backoffMs: 500 });
  } catch (err) {
    await lastValueFrom(this.kafka.emit('order.placed.dlq', {
      key: event.orderId,
      value: event,
      headers: { error: String(err), 'source-offset': ctx.getMessage().offset },
    }));
    // If autoCommit: false, commit (BigInt(ctx.getMessage().offset) + 1n).toString() after DLQ emit succeeds
  }
}
```

---

### Prevent Dual-Write Loss with Transactional Outbox [CRITICAL]

- **Rule:** NEVER write to the database and then call `this.kafka.emit()` directly in the same request path (the **dual-write trap**). Save the domain entity and an `outbox_events` row inside **one atomic database transaction**, then let a background relay (poller or CDC/Debezium) publish pending rows to Kafka with retries and mark them published.
- **Why:** If the process crashes or Kafka is unreachable after `db.save(order)` but before `kafka.emit()`, the order is committed with no event ever emitted; reversing the order emits phantom events for rolled-back DB writes.

```ts
// ❌ Incorrect: dual-write trap — crash between lines loses the event permanently
const order = await this.ordersRepo.save(this.ordersRepo.create(dto));
await lastValueFrom(this.kafka.emit('order.placed', { key: order.id, value: toEvent(order) }));

// ✅ Correct: TypeORM Transactional Outbox (order + outbox row commit atomically)
const order = await this.dataSource.transaction(async (tx) => {
  const saved = await tx.save(Order, tx.create(Order, { ...dto, status: 'PENDING' }));
  await tx.save(OutboxEvent, tx.create(OutboxEvent, {
    topic: 'order.placed',
    partitionKey: saved.id,
    payload: { eventId: randomUUID(), orderId: saved.id, customerId: saved.customerId, total: saved.total, placedAt: new Date().toISOString(), version: 1 },
  }));
  return saved;
});
// Relay (poller with FOR UPDATE SKIP LOCKED or Debezium CDC) emits pending rows -> Kafka
```
