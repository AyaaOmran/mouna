# Performance and scalability

Targets are approved in ADR-011. They are goals for measurement, not current results.

## Database

- Use the indexes in the ERD and in `DATABASE_DESIGN.md`.
- Paginate every list. Whitelist sort fields and end every order with an `id` tie-breaker. The product list sort values are `most_ordered`, `newest`, `price_asc`, `price_desc`, and `rating`.
- Load relations required by the DTO in the same query. Do not loop queries per row.
- Select only columns required by the response DTO. Every new index beyond the ERD and database-design set needs a concrete query shape and a plan reviewed against representative data; avoid redundant and low-selectivity indexes.
- Lock stock rows in primary-key order.
- Pool size comes from TypeORM configuration. Start with the driver default and change it only after a measurement. Do not add PgBouncer in v1.

## Redis

Use Redis for BullMQ and for the throttler. Do not cache catalog responses until a measured endpoint misses the p95 target. Invalidation for prices and stock is easy to get wrong, and the catalog is not known to be hot.

Socket.IO uses no Redis adapter while the application runs as one instance. If deployment becomes multi-instance, add the Socket.IO Redis adapter and load-balancer sticky sessions together; neither is a response cache.

## Application

- One Node process is the design assumption.
- Order creation holds row locks for the transaction only. It does not call the SMS provider or the payment gateway inside the stock transaction. Gateway calls happen after the order commits, in `POST /payments`.
- Webhook handling stays synchronous and short: verify, lock, update, commit.

## Measurement

When a feature is performance-sensitive (catalog list, order create, webhook), add a test or a manual timing note to the progress log. Do not mark the performance criterion verified from a document alone.

Load and stress tooling is not selected. A later ADR can add it. Until then, the checkpoint is a single-user timing of the two targets above against a migrated database with representative seed data.
