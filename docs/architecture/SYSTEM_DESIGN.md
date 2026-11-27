# System design

MONAT v1 is one NestJS process, one PostgreSQL database, and one Redis. Redis backs BullMQ and the throttler. It is not a second source of business data.

```text
Client
  → HTTP /api/v1
  → guard, validation, localization
  → feature service
  → TypeORM transaction
  → PostgreSQL
  → enqueue only OTP, expiry, and delivery reminders
Redis / BullMQ workers in the same codebase
```

Workers are part of the modular monolith. They are not a separate service in v1. They can run in the API process. Splitting a worker process later does not require new infrastructure beyond the approved Redis.

## Request path

1. Helmet, CORS from configuration, global prefix `api/v1`.
2. Global auth guard. `@Public()` opts out.
3. Permission guard for admin routes.
4. Validation pipe. Unknown fields are rejected. Failures are 422.
5. Service transaction for any write that changes money, stock, or status.
6. Map to a response DTO. Never return an entity.

## Module rules

- One module owns each table through `TypeOrmModule.forFeature`.
- Exports are services, not repositories.
- Feature modules are not `@Global()`.
- No `forwardRef` cycles. Share a small service module instead.
- Domain events inside the process are optional and not required for v1. Call the notifications service in the same transaction when a row must exist even if a later job fails.

## Approved cross-cutting behavior

| Concern | Decision |
|---|---|
| Module format | CommonJS. Nest 12 packages are ESM and load through Node `require(esm)`. |
| IDs | Integer PKs. Public QR uses `VoiceMessage.uuid`. |
| Schema | Migrations only. `synchronize: false`. |
| Money | `numeric(10,2)`, currency SYP |
| Auth | 15-minute JWT access token, opaque refresh token, Argon2id |
| Language | `Accept-Language`, default `ar` |
| Pagination | `page`, `limit`, default 20, maximum 100 |
| Jobs | OTP SMS, payment expiry, delivery reminders |
| Providers | Payment, SMS, and file storage are interfaces. No vendor is selected. |

## What is intentionally absent

Microservices, Kafka, RabbitMQ, gRPC, Socket.IO, a CMS, a cart service, a product-variant model, a translation table, and a deployment platform. CI is described without a vendor workflow. The scaffold GitHub Actions file is not adopted.

## Performance targets

Approved for later measurement, not as a claim about the current scaffold:

- Catalog and account reads: p95 under 500 ms on one application instance.
- Order creation: p95 under 800 ms on one instance, excluding the external gateway.
- No expected user count is documented.
- Add cache only after a measurement shows a miss against these targets.

## Process shape

`src/` is organized by feature module. Suggested layout is in [MODULES.md](MODULES.md). Shared bootstrap, the exception filter, and i18n live under `src/common` and `src/config`.
