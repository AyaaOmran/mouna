# Architecture decisions

Status values: Accepted unless explicitly marked Superseded. Decisions were approved on 27 or 28 November 2026, or in the architecture prompt. ADR-014 supersedes ADR-001 only for the module format and test runner; the other ADR-001 decisions remain in force. These decisions override the concept and OpenAPI contract only where this file says so. Original files are preserved unchanged.

## ADR-001 Stack and shape — Superseded in part by ADR-014

**Original decision:** NestJS 12, TypeScript, PostgreSQL, TypeORM, Swagger, npm, CommonJS, Jest. Modular monolith. Redis and BullMQ are required. Kafka, RabbitMQ, gRPC, microservices, and Socket.IO are excluded.

The CommonJS/Jest choice is superseded by ADR-014. The modular-monolith shape, persistence stack, Redis/BullMQ requirement, and exclusions remain accepted.

## ADR-002 Schema control

`synchronize: false`. Migrations only. Integer primary keys. `VoiceMessage.uuid` is the only public identifier. Money is `numeric(10,2)`. Currency is SYP. Address history uses the ERD soft-delete rule. Other tables are not soft-deleted.

## ADR-003 Orders before payment

Regular electronic checkout creates an `awaiting_payment` order and reserves stock before the gateway call. Success moves it to `pending` / `paid`. An admin still confirms it. Cash on delivery is created as `pending` / `unpaid`. Shipping and events stay `pending` until approval, then `awaiting_payment`.

This replaces the concept and OpenAPI behavior that created a payment with a null `order_id` and created the order afterward.

## ADR-004 Inventory

Ready products and boxes are reserved in the order-creation transaction, including shipping and event orders that are still pending review. Made-to-order lines do not change stock. Release is idempotent through `Order.inventory_held` when the order is rejected, cancelled, or expired. Subscription deliveries do not decrement stock in v1.

## ADR-005 Payment integrity

A `PaymentTransaction` has exactly one of `order_id` or `subscription_id`. A `Refund` has exactly one of those foreign keys. Webhooks are idempotent on unique `gateway_reference`. Expiry and confirmation lock the parent row. A late success does not reopen a cancelled order or subscription.

The gateway vendor is not selected. The port is `PaymentGateway`. Production payments stay behind that port until a vendor ADR is accepted.

## ADR-006 Cancellation and subscription refunds

Customers cancel regular or scheduled orders only in `pending` or `confirmed`, and shipping or event orders only in `pending` or `awaiting_payment`. Later changes are admin-only. Electronic refunds are manual admin records.

Approving a subscription cancellation cancels the subscription and remaining `scheduled` deliveries. The admin types the refund amount. There is no automatic proration.

## ADR-007 Subscription dates and ratings

Weekly deliveries are `start_date + 7 days`, repeated. Seasonal deliveries are `start_date` plus three calendar months, repeated. That interval is the approved meaning of one delivery per season. Admins may edit a delivery date. Holidays do not shift generated dates. The upcoming-delivery notification is due 24 hours before the delivery date.

Ratings are integers from 1 to 5. There is no product-variant table.

## ADR-008 Auth

Short-lived JWT access tokens last 15 minutes. Opaque refresh tokens are stored as hashes, last 30 days, rotate, and are revoked on logout. `OtpChallenge` stores a hashed code, purpose, expiry, attempts, and temporary phone data. Registration creates the customer after OTP success. Password hashing is Argon2id. SMS vendor is not selected. The port is `SmsSender`.

## ADR-009 Localization

Default locale is Arabic. `Accept-Language` of `ar` or `en` selects the language. Other values fall back to Arabic. API field names, enums, and status codes stay stable. English catalog text uses nullable `*_en` columns on the existing entities. There is no translation table. Notification text is stored in the language used at creation time, plus a stable type code.

## ADR-010 Permissions

Ten section permissions with operation `manage`: grandmas, products, categories, orders, subscriptions, events, delivery, gifts, customers, reports. Super Admin bypasses them and is the only role for admin management, settings, payment configuration, commission, and the activity log.

Read-only access exceptions: `GET /admin/categories` and `GET /admin/seasons` accept `products` or `categories`, so the product editor can load its reference lists. `GET /admin/orders` and `GET /admin/orders/{id}` accept `orders`, `events`, or `gifts`; the query/detail result must be scoped to the event or gift view when the latter permission is used. Mutations always require the owning section. In OpenAPI, an array in `x-required-permission` means OR.

## ADR-011 External boundaries and performance

File uploads go through a storage port. The development adapter may use local disk. The production store is unresolved. URLs are what the database stores.

CI/CD is provider-neutral. The scaffold GitHub Actions workflow is not the approved pipeline.

Targets, to be measured later: p95 under 500 ms for catalog and account reads, and under 800 ms for order creation excluding the gateway, on one instance. Cache is not added before a measurement misses those targets.

## ADR-012 API pagination

List metadata uses `page` and `limit`. This replaces OpenAPI `page_size`. Default limit is 20. Maximum is 100, which was already the OpenAPI cap.

## ADR-013 Mark cash orders as paid

**Status:** Accepted, 28 November 2026.

**Context:** Cash-on-delivery orders start with `payment_status = unpaid`. The business rules say the order must not become paid automatically when it is delivered; an admin records payment when cash is collected.

**Decision:** Reuse the existing `PATCH /admin/orders/{orderId}` route. Add an optional `payment_status` field that accepts only `paid`, and only for an eligible `cash_on_delivery` order. Keep `delivery_responsible_note` independently optional, so either field can be sent alone or both can be sent together. Reject a non-cash, already-paid, or otherwise ineligible transition with `409`. Do not add a route.

**Consequences:** The service must verify the payment method and current payment state before applying the transition, then record the successful change in the admin activity log. Delivery alone never marks cash as paid.


## ADR-014 Native ESM and Vitest

**Status:** Accepted, 28 November 2026. Supersedes the module-format and test-runner choice in ADR-001.

**Context:** The repository scaffold already uses ESM and Vitest. NestJS 12's CLI supports ESM projects and uses Vitest for newly generated ESM projects. Keeping the scaffold's native module and test setup avoids an unnecessary conversion to CommonJS/Jest.

**Decision:** Use native ESM throughout the application and Vitest as the only test runner. `package.json` declares `"type": "module"`; TypeScript uses `module: "NodeNext"` and `moduleResolution: "NodeNext"`. Relative imports include `.js` extensions. CommonJS globals are prohibited unless a narrowly scoped interop boundary explicitly requires `createRequire`. Vitest APIs are imported explicitly; globals remain disabled. E2E Supertest uses a default import. Use `vitest` and the matching `@vitest/coverage-v8` version; do not install Jest, `ts-jest`, or `@types/jest`.

**Consequences:** Update TypeScript imports, config and migration scripts to ESM. Use `import.meta.dirname` on Node 26 instead of `__dirname`/`__filename`. Update test scripts and Jest-specific mocks to Vitest equivalents. `@nestjs/testing`, Supertest, TypeORM, PostgreSQL, Redis, and BullMQ remain unchanged.

## ADR-015 Maximum five active saved addresses per customer

**Status:** Accepted, 28 November 2026.

**Context:** The customer address book supports multiple saved delivery addresses. A bounded list is required for the initial product release.

**Decision:** A customer may have at most **5 active saved addresses**: rows owned by the customer where `deleted_at IS NULL`. Soft-deleted addresses retained for order and subscription history do not count. The cap applies only to saved customer address-book entries managed by `/me/addresses`; recipient address text stored on event, gift, or shipping orders is outside this cap. Creating a sixth active address returns `409 ADDRESS_LIMIT_REACHED`.

**Concurrency and lifecycle:** The create operation runs in a database transaction and first locks the owning `User` row with `SELECT ... FOR UPDATE`, then counts active addresses and inserts only when the count is below five. All operations that can increase the active count must take the same lock. Updating an address that is already referenced by an order or subscription soft-deletes the old row and inserts its replacement in the same transaction, so the active count remains unchanged. Deletion frees an active slot. Keep `synchronize: false`; ship the supporting partial index through a migration.

**Consequences:** The feature doc, business logic, database design, error catalog, Swagger contract, and address tests must reflect this limit. No new endpoint or request field is required.
