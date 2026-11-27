# Architecture decisions

Status values: Accepted. These decisions were approved on 27 November 2026 or in the architecture prompt. They override the concept and the OpenAPI contract only where this file says so. The original files were not edited.

## ADR-001 Stack and shape

NestJS 12, TypeScript, PostgreSQL, TypeORM, Swagger, npm, CommonJS, Jest. Modular monolith. Redis and BullMQ are required. Kafka, RabbitMQ, gRPC, microservices, and Socket.IO are excluded.

CommonJS is viable on NestJS 12 because the CLI supports `--type cjs` and Node loads Nest's ESM packages with `require(esm)` from Node 20.19 and 22.12 upward. The current scaffold is ESM and Vitest. Implementation converts it. That conversion is not a compatibility blocker.

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

## ADR-011 External boundaries and performance

File uploads go through a storage port. The development adapter may use local disk. The production store is unresolved. URLs are what the database stores.

CI/CD is provider-neutral. The scaffold GitHub Actions workflow is not the approved pipeline.

Targets, to be measured later: p95 under 500 ms for catalog and account reads, and under 800 ms for order creation excluding the gateway, on one instance. Cache is not added before a measurement misses those targets.

## ADR-012 API pagination

List metadata uses `page` and `limit`. This replaces OpenAPI `page_size`. Default limit is 20. Maximum is 100, which was already the OpenAPI cap.
