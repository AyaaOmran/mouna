# Architecture decisions

Status values: Accepted unless explicitly marked Superseded. Decisions were approved on 27 or 28 November 2026, or in the architecture prompt. ADR-014 supersedes ADR-001 only for the module format and test runner; the other ADR-001 decisions remain in force. These decisions override the concept and OpenAPI contract only where this file says so. Original files are preserved unchanged.

## ADR-001 Stack and shape — Superseded in part by ADR-014

**Original decision:** NestJS 12, TypeScript, PostgreSQL, TypeORM, Swagger, npm, CommonJS, Jest. Modular monolith. Redis and BullMQ are required. Kafka, RabbitMQ, gRPC, microservices, and Socket.IO are excluded.

The CommonJS/Jest choice is superseded by ADR-014. The modular-monolith shape, persistence stack, Redis/BullMQ requirement, and exclusions remain accepted.

## ADR-002 Schema control

`synchronize: false`. Migrations only. Integer primary keys. `VoiceMessage.uuid` is the only public identifier. Money is `numeric(10,2)`. Currency is SYP. Address history uses the ERD soft-delete rule. Other tables are not soft-deleted.

## ADR-003 Orders before payment — Superseded by ADR-020

**Status:** Superseded by ADR-020 on 28 November 2026. Kept for history.

Regular electronic checkout creates an `awaiting_payment` order and reserves stock before the gateway call. Success moves it to `pending` / `paid`. An admin still confirms it. Cash on delivery is created as `pending` / `unpaid`. Shipping and events stay `pending` until approval, then `awaiting_payment`.

This replaces the concept and OpenAPI behavior that created a payment with a null `order_id` and created the order afterward.

ADR-020 keeps the order-first sequence because `PaymentTransaction` requires `order_id`, but removes `awaiting_payment`, the approval-then-payment path, and the order payment deadline.

## ADR-004 Inventory

Ready products and boxes are reserved in the order-creation transaction, including shipping and event orders that are still pending review. Made-to-order lines do not change stock. Release is idempotent through `Order.inventory_held` when the order is cancelled. There is no order-expiry path (ADR-020). Subscription deliveries do not decrement stock in v1.

## ADR-005 Payment integrity

A `PaymentTransaction` has exactly one of `order_id` or `subscription_id`. A `Refund` has exactly one of those foreign keys. Webhooks are idempotent on unique `gateway_reference`. Expiry and confirmation lock the parent row. A late success does not reopen a cancelled order or subscription.

The gateway vendor is not selected. The port is `PaymentGateway`. Production payments stay behind that port until a vendor ADR is accepted.

## ADR-006 Cancellation and subscription refunds

Customers cancel regular or scheduled orders only in `pending` or `confirmed`, and shipping or event orders only in `pending`. Later changes are admin-only. Electronic refunds are manual admin records.

**Amended by ADR-020:** `awaiting_payment` no longer exists. Shipping and event orders are cancellable only while `pending`; confirmation requires `payment_status = paid`.

Approving a subscription cancellation cancels the subscription and remaining `scheduled` deliveries. The admin types the refund amount. There is no automatic proration.

## ADR-007 Subscription dates and ratings — Superseded in part by ADR-018

Weekly deliveries are `start_date + 7 days`, repeated. Seasonal deliveries are `start_date` plus three calendar months, repeated. That interval is the approved meaning of one delivery per season. Admins may edit a delivery date. Holidays do not shift generated dates. The upcoming-delivery notification is due 24 hours before the delivery date.

Ratings are integers from 1 to 5. There is no product-variant table.

**Amended by ADR-018:** the rating unit is the delivered order, not the order item or the product. The subscription-date rules above remain accepted.

## ADR-008 Auth

Short-lived JWT access tokens last 15 minutes. Opaque refresh tokens are stored as hashes, last 30 days, rotate, and are revoked on logout. `OtpChallenge` stores a hashed code, purpose, expiry, attempts, and temporary phone data. Registration creates the customer after OTP success. Password hashing is Argon2id. SMS vendor is not selected. The port is `SmsSender`.

## ADR-009 Localization — Superseded by ADR-017

**Status:** Superseded by ADR-017 on 28 November 2026. Kept for history.

Default locale is Arabic. `Accept-Language` of `ar` or `en` selects the language. Other values fall back to Arabic. API field names, enums, and status codes stay stable. English catalog text uses nullable `*_en` columns on the existing entities. There is no translation table. Notification text is stored in the language used at creation time, plus a stable type code.

ADR-017 removes the second locale entirely. The stable technical names remain.

## ADR-010 Permissions — Superseded by ADR-019

**Status:** Superseded by ADR-019 on 28 November 2026. Kept for history.

Ten section permissions with operation `manage`: grandmas, products, categories, orders, subscriptions, events, delivery, gifts, customers, reports. Super Admin bypasses them and is the only role for admin management, settings, payment configuration, commission, and the activity log.

Read-only access exceptions: `GET /admin/categories` and `GET /admin/seasons` accept `products` or `categories`, so the product editor can load its reference lists. `GET /admin/orders` and `GET /admin/orders/{id}` accept `orders`, `events`, or `gifts`; the query/detail result must be scoped to the event or gift view when the latter permission is used. Mutations always require the owning section. In OpenAPI, an array in `x-required-permission` means OR.

ADR-019 replaces the ten sections with 26 function-level keys grouped into seven sections.

## ADR-011 External boundaries and performance

File uploads go through a storage port. The development adapter may use local disk. The production store is unresolved. URLs are what the database stores.

CI/CD is provider-neutral. The scaffold GitHub Actions workflow is not the approved pipeline.

Targets, to be measured later: p95 under 500 ms for catalog and account reads, and under 800 ms for order creation excluding the gateway, on one instance. Cache is not added before a measurement misses those targets.

## ADR-012 API pagination — Extended by ADR-022

List metadata uses `page` and `limit`. This replaces OpenAPI `page_size`. Default limit is 20. Maximum is 100, which was already the OpenAPI cap.

ADR-022 adds the deterministic sort tie-breaker, the unpaginated allow-list, the dashboard top-N rule, and the out-of-range page behavior.

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

## ADR-016 Socket.IO order-status monitoring

**Status:** Accepted, 28 November 2026.

**Decision:** Socket.IO is approved only for authenticated order-status monitoring. `OrdersModule` owns the gateway, which emits the documented `order.status.updated` event after the order-status transaction commits. REST stays the source of truth. The socket accepts authenticated room subscriptions only; it accepts no state-changing command. Customers join only their own orders; admin access follows the HTTP order-detail authorization and its event/gift read scoping.

**Consequences:** Add the Socket.IO Nest packages during Phase 0. No Socket.IO Redis adapter is used for the one-instance deployment. A later multi-instance deployment needs that adapter plus sticky-session support. See [ADR-016](adr/ADR-016-order-status-socketio.md) and [REALTIME.md](../api/REALTIME.md).

## ADR-017 Arabic-only product surface

**Status:** Accepted, 28 November 2026. Supersedes ADR-009.

**Context:** The Arabic v2 spec makes the website and dashboard Arabic only, RTL, with no language switcher (`spec §11`). It treats status values as technical names in code and the API only, displayed to users in Arabic. The package still carried a second locale through `Accept-Language`, nullable `*_en` columns, an English message catalog, and locale tests.

**Decision:** Arabic is the only product language.

- No `Accept-Language` handling. The API returns Arabic messages and Arabic catalog text only.
- No `*_en` columns and no English catalog text in the database.
- No `SystemSetting.language` value and no `language` field in public settings.
- No English message catalog. One Arabic catalog keyed by the stable error code.
- Notification text is stored in Arabic at insert time, with the stable `type` code unchanged.
- Field names, enums, status codes, error codes, permission keys, database columns, code, comments, and all documentation stay English. That is not bilingual support.
- `docs/api/LOCALIZATION.md` is deleted. The "docs and code stay English" rule moves to `AGENTS.md`.

**Consequences:** Remove the English columns through a migration; delete the locale interceptor branch and the English catalog; delete the two-locale tests; remove the language field from settings, the public settings payload, the admin settings screen, and the OpenAPI schemas. `LOCALIZATION.md` links are removed from every document.

## ADR-018 One review per delivered order

**Status:** Accepted, 28 November 2026. Supersedes the rating clause of ADR-007 and the per-order-item review rule.

**Context:** The spec reviews each product in a delivered order (`spec §3.9`, `§10.4`, `§28`, `§36`). The product owner replaces that with one review per delivered order. The package's per-item model cannot express it.

**Decision:** A customer may create exactly one review for an order that is `delivered`.

- `Review` has `id`, unique `order_id`, `rating` 1–5, optional `comment` (max 2000), `published_at`, `created_at`, and `updated_at`.
- `order_item_id` and `product_id` are removed from `Review`.
- The route is `POST /orders/{orderId}/review`. It replaces `POST /orders/{orderId}/items/{orderItemId}/review`.
- The review is published immediately. There is no moderation, edit, or delete route.
- Grandma `avg_rating` is the average of the ratings of her delivered orders. It is computed, not stored.
- Product `rating_avg` remains because the product card and the `rating` sort need it (`spec §3.2`). It is derived from the ratings of delivered orders that contain the product.
- Review comments are stored but not exposed as a public list. The product page has no reviews list in the spec (`spec §3.4`).
- Subscription deliveries are not reviewable. They are not orders (`spec §11` item 6; `§38.4`).
- An order that contains only a box or a made-to-order item still gets one review.

**Consequences:** Add a `Review` delta to `DATABASE_DESIGN.md`; replace the review path, schemas, and tests; update the catalog and grandma aggregates; record the deviation from the spec in the feature file and the progress log. The three owner questions in the Phase 1 report are resolved by this ADR.

## ADR-019 Function-level permissions in seven sections

**Status:** Accepted, 28 November 2026. Supersedes ADR-010.

**Context:** The spec grants 26 independent function keys grouped into seven display sections (`spec §12`). An edit key requires its section's view key, and the Super Admin screen grants the view key automatically (`spec §12`). The package used ten `manage` section permissions and had `events`, `gifts`, and `delivery` sections that the spec forbids (`spec §13`).

**Decision:** The permission catalogue is the 26 keys below. `Permission` stores one key per row; `UserPermission` assigns keys to an admin.

| Section | Keys |
|---|---|
| Dashboard | `dashboard.view_stats`, `dashboard.view_attention_orders`, `dashboard.view_upcoming_deliveries` |
| Orders | `orders.view`, `orders.accept_reject`, `orders.update_status`, `orders.cancel`, `orders.manage_payment_shipping` |
| Products | `products.view`, `products.create_edit`, `products.manage_price_stock`, `products.manage_availability_publish` |
| Grandmas | `grandmas.view`, `grandmas.create_edit`, `grandmas.change_status`, `grandmas.set_of_month` |
| Subscriptions | `subscriptions.view`, `subscriptions.manage_plans`, `subscriptions.view_deliveries`, `subscriptions.update_delivery_status` |
| Customers | `customers.view`, `customers.view_addresses`, `customers.view_orders_subscriptions` |
| Reports | `reports.orders_sales`, `reports.subscriptions`, `reports.grandma_dues` |

Rules:

- Every API and every dashboard button checks a specific key.
- An edit key requires the matching `*.view` key. The Super Admin screen grants view automatically when an edit key is selected.
- Event and gift orders are filters on the single orders table (`spec §11` item 1; `spec §15`). There is no `events` or `gifts` section.
- There is no `delivery`, `categories`, `boxes`, or `settings` section. Delivery reference data is seeded, not administered (`ADR-021`).
- Category and season writes use `products.create_edit`; the product editor reads them with `products.view`.
- Order refunds use `orders.manage_payment_shipping`. Subscription refunds and cancellation-request decisions use `subscriptions.update_delivery_status`.
- Super Admin bypasses every key and is the only role for admin management and the activity log.
- In OpenAPI, `x-required-permission` is a single key or an array of alternative keys (OR).

**Consequences:** Seed 26 keys in a migration; replace `x-required-permission` on every admin route; update the Super Admin assignment screen and tests; delete the `events`, `gifts`, and `delivery` sections from the catalogue and the route mapping.

## ADR-020 Payment with `order_id` and the simplified order status set

**Status:** Accepted, 28 November 2026. Supersedes ADR-003. Amends ADR-006.

**Context:** The spec takes electronic payment inside Checkout before the order is submitted and has one order path with seven statuses (`spec §5`, `§10.2`, `§10.3`, `§9.2`, `§38.2`, `§38.3`). The package created an `awaiting_payment` order, approved shipping and events before payment, and ran an order-expiry job. The product owner requires `PaymentTransaction.order_id`, so the order row must exist before the gateway call.

**Decision:** Keep the order-first technical sequence; change the statuses and the payment rules.

- `POST /orders` creates the order as `pending` / `unpaid` and reserves stock (ADR-004). The status set is `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`.
- `POST /payments` keeps `order_id`. A successful webhook sets `payment_status = paid` and leaves the order `pending`.
- A failed attempt leaves the order `pending` / `unpaid`. The customer may start another transaction. `PaymentTransaction` keeps `failed`; the order `payment_status` does not.
- `awaiting_payment` is removed. There is no approval-then-payment path.
- Shipping and event orders are electronic-only and cannot move to `confirmed` unless `payment_status = paid`.
- Regular and scheduled orders may be confirmed while `unpaid` (cash on delivery). Cash is marked `paid` only through ADR-013.
- Rejection is from `pending` only and sets `cancelled` with `cancel_reason`. The `rejected` status is removed.
- Shipping uses `out_for_delivery` when the parcel is handed to the carrier, then `delivered`. `shipped` and `in_transit` are removed.
- `Order.payment_deadline` and the `expire-order` job are removed. Only subscriptions keep a payment deadline and `expire-subscription`.
- A customer may cancel a shipping or event order while it is `pending`. An unpaid shipping or event order that is abandoned can be cancelled by the customer or an admin.

**Consequences:** Remove the three statuses, the order deadline field, the expiry job, the `payment_deadline` sort, and the `awaiting_payment_orders` dashboard card. Add the `paid` guard to approval. Update the state machine, flows, features, Swagger, tests, and job documentation.

## ADR-021 Seeded delivery reference data and nearest-date rule

**Status:** Accepted, 28 November 2026.

**Context:** The spec keeps service zones and fixed fees, a fixed country fee, and a simple fixed delivery-period list, all prepared before launch. It removes holiday calendars, weekday slot tables, shipping-company accounts, and operational settings pages (`spec §9.1`, `§9.2`, `§11` item 8, `§19`, `§22`, `§26`, `§30`). It does not state the nearest-date rule.

**Decision:**

- Keep `DeliveryZone` (`name`, `fee`, `is_active`), `DeliveryPeriod` (`name`, `start_time`, `end_time`), `ShippingCountry` (`name`, `fee`, `is_active`), and `DeliverySetting.min_preparation_hours` (seeded, default 4).
- Remove `Holiday`, `DeliverySlot`, and `ShippingCompany`.
- `OrderShippingDetail` stores `shipping_company_name` as free text next to `tracking_number`. There is no company table or foreign key.
- No admin CRUD for zones, periods, countries, or delivery settings. Seed them before launch. A later small screen needs a new ADR.
- The nearest-date rule: a date is deliverable when at least one active period starts at least `min_preparation_hours` after the current time and the date is not earlier than `today + the longest lead_time_days` in the order. Every calendar day is deliverable. There is no holiday exclusion and no capacity check.
- A non-scheduled order gets the earliest deliverable date and its first qualifying period. A scheduled order may choose any deliverable date and period at or after `today + the longest lead_time_days`.
- `GET /delivery/availability` returns `min_date`, `earliest`, and `dates` for a window of 14 days by default and at most 60 days.

**Consequences:** Remove the three tables and their paths; seed zones, periods, countries, and the setting; rewrite availability, order assignment, and checkout validation; update the module ownership and tests. The rule is fixed by this ADR and can be changed only by a later ADR.

## ADR-022 Pagination determinism and the unpaginated allow-list

**Status:** Accepted, 28 November 2026. Extends ADR-012.

**Decision:**

- Every collection endpoint paginates with `page` and `limit` (default 20, maximum 100) and returns `{ data, meta: { page, limit, total, total_pages } }`.
- `total_pages = ceil(total / limit)`; when `total = 0`, `total_pages = 0`.
- `page > total_pages` returns `data: []` with correct metadata, not `422`.
- `page < 1`, `limit < 1`, or `limit > 100` is `422`.
- Every list has a whitelisted sort or a fixed server order and ends with an `id` tie-breaker: `id DESC` for time-ordered lists, `id ASC` for name-ordered lists.
- The unpaginated allow-list is limited to small, fixed, or seeded lists: categories, delivery zones, shipping countries, payment methods, saved addresses (maximum five), delivery availability (bounded window), the seeded permission catalogue, seeded payment methods, and the subscription report (single aggregate object).
- The dashboard home blocks are capped, not paginated: `latest_orders` is the 10 newest and `upcoming_deliveries` is the next 7 days capped at 20.
- Cursor pagination is not used.

**Consequences:** Add `Page`/`Limit` and page wrappers to the twelve endpoints identified in the Phase 1 report; add sort whitelists; update the conventions, the contract, the feature files, and the pagination tests.
