# Implementation plan

Foundation comes before features that depend on it. Do not start a feature whose dependency is still Not Started. Status names are in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Phase 0 — Foundation

- Convert the scaffold from ESM and Vitest to CommonJS and Jest.
- Pin the versions in [TECH_STACK.md](../engineering/TECH_STACK.md) and re-check patches on that day.
- Extend configuration, the error filter, and the Arabic and English message map.
- Add TypeORM migrations setup with `synchronize: false`.
- Register Redis, BullMQ, and the throttler.
- Checkpoint: unit test runs on Jest. The application boots with PostgreSQL and Redis. No feature is Verified yet.

## Phase 1 — Identity and reference data

1. Migrations for users, permissions, OTP, refresh tokens, settings, and the English columns that those tables need.
2. Authentication.
3. Super Admin settings and permission assignment, enough to create an admin.
4. Delivery settings.
5. Categories, seasons, grandmas, products, boxes.

Checkpoint: an admin can create a shippable pantry product and a zone. Security tests for auth and permissions pass.

## Phase 2 — Orders and payments

1. Addresses.
2. Preview and order creation with stock locks.
3. Shipping, events, and gifts as part of the order transaction.
4. Payment port, fake adapter, webhook, refunds, expiry jobs.
5. Notifications inserted with status changes.
6. Reviews.

Checkpoint: concurrency tests and webhook tests in the testing strategy pass. Performance timing for order creation is recorded. It is not a pass unless the measurement was run.

## Phase 3 — Subscriptions and reporting

1. Plans, subscribe, activation rows, reminders, cancellation refund.
2. Dashboard and reports.
3. Customer admin reads.

Checkpoint: subscription date tests and dues fixture test pass.

## Phase 4 — Hardening

- Migration on an empty database.
- Locale sweep for the error catalog.
- Dependency audit.
- Backup and restore procedure written down. The restore drill waits for a host.

## Definition of done

See [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md). Update the feature file, status, progress log, and any contract or schema doc the feature changed.

## Checkpoints by criterion

| Criterion | Checkpoint |
|---|---|
| API | Contract deltas covered by supertest |
| Architecture | Module ownership review on the pull request |
| Performance | Timed catalog read and order create |
| Jobs | Expiry, reminder, and OTP tests |
| Database | Migration applies. Constraint tests for refund and stock |
| Security | Auth, IDOR, webhook signature, throttling |
| Testing | Required tests executed |
| CI | Pipeline stages described in CI_CD run once a provider exists |
