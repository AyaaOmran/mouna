# Change impact report — Arabic v2 spec sync

**Phase 1 deliverable. No document outside this file has been edited.**

Authority for this report:

- Product, website, and dashboard behavior: the Arabic v2 spec at
  `D:\]Downloads\Telegram Desktop\Monet_AlJaddat_Complete_Merged_Spec_v2 (1).md`,
  cited as `spec §N`.
- Technical decisions: the accepted ADRs in `docs/architecture/ARCHITECTURE_DECISIONS.md`.
- Package state: the files under `docs/`, `.cursor/`, `AGENTS.md`, and `README.md`.

Labels used on every finding:

| Label | Meaning |
|---|---|
| **CONFIRMED** | The spec states it explicitly; the package must match it. |
| **DERIVED** | Follows from a spec rule plus a package rule, with no invented value. |
| **PROPOSED** | A change requested in the C1–C5 brief that the spec does not state. It needs owner approval. |
| **UNRESOLVED** | The spec is silent or contradictory. It goes to `docs/planning/OPEN_QUESTIONS.md`; no value is filled in. |

The spec is 1,838 lines. Section titles below are the Arabic headings; the English
gloss is for navigation only.

---

## 1. Phase 0 — files opened

Every file below was opened during this audit. `read` means the full file was read
(not only listed). The spec was read in full across four reads.

### 1.1 Root and spec

| Path | Read | One-line purpose |
|---|---|---|
| `AGENTS.md` | yes | Always-loaded agent rules: invariants, doc order, status gate. |
| `README.md` | yes | Package map, authority order, token loading, version note. |
| `D:\]Downloads\Telegram Desktop\Monet_AlJaddat_Complete_Merged_Spec_v2 (1).md` | yes | Authoritative Arabic v2 product spec, §1–§38. |

### 1.2 `.cursor/rules/`

| Path | Read | One-line purpose |
|---|---|---|
| `.cursor/rules/api.mdc` | yes | HTTP contract, DTO validation, envelope, status codes. |
| `.cursor/rules/architecture.mdc` | yes | Modular-monolith boundaries and dependency direction. |
| `.cursor/rules/backend.mdc` | yes | NestJS backend implementation conventions. |
| `.cursor/rules/background-jobs.mdc` | yes | BullMQ queues, retries, transaction boundaries. |
| `.cursor/rules/cicd.mdc` | yes | Pipeline stages; no vendor file until chosen. |
| `.cursor/rules/database.mdc` | yes | Migrations, constraints, locks, numeric money. |
| `.cursor/rules/design-patterns.mdc` | yes | Pattern selection without over-abstraction. |
| `.cursor/rules/documentation.mdc` | yes | Doc structure, traceability, status/progress updates. |
| `.cursor/rules/evidence-first.mdc` | yes | Cite sources; do not invent facts. |
| `.cursor/rules/git.mdc` | yes | Branch, commit, and pull-request hygiene. |
| `.cursor/rules/performance.mdc` | yes | p95 targets, N+1 avoidance, index evidence, cache restraint. |
| `.cursor/rules/realtime.mdc` | yes | Socket.IO scope, handshake auth, no state-changing commands. |
| `.cursor/rules/security.mdc` | yes | Auth, IDOR, secrets, webhooks, upload policy. |
| `.cursor/rules/testing.mdc` | yes | Vitest layers, required cases, definition of done. |

### 1.3 `.cursor/skills/`

| Path | Read | One-line purpose |
|---|---|---|
| `.cursor/skills/evidence-first/SKILL.md` | yes | Require citations and explicit labels for claims. |
| `.cursor/skills/monat-feature-workflow/SKILL.md` | yes | Required steps for every MONAT feature change. |
| `.cursor/skills/nestjs-universe/SKILL.md` | yes | Entry point for the NestJS standards pack. |
| `.cursor/skills/nestjs-universe/assets/auth-guard.md` | yes | Guard implementation example. |
| `.cursor/skills/nestjs-universe/assets/core-bootstrap.md` | yes | Bootstrap, global pipes, prefix, Swagger example. |
| `.cursor/skills/nestjs-universe/references/architecture-and-modules.md` | yes | Modules, DI, providers, exports. |
| `.cursor/skills/nestjs-universe/references/auth-and-security.md` | yes | JWT, guards, hashing, RBAC, ownership. |
| `.cursor/skills/nestjs-universe/references/database-orm-migrations.md` | yes | TypeORM entities, migrations, transactions. |
| `.cursor/skills/nestjs-universe/references/http-and-realtime-apis.md` | yes | Controllers, DTOs, Swagger, gateways. |
| `.cursor/skills/nestjs-universe/references/performance-and-caching.md` | yes | N+1, indexes, pagination, caching. |
| `.cursor/skills/nestjs-universe/references/queues-and-background-jobs.md` | yes | BullMQ processors, retries, idempotency. |
| `.cursor/skills/nestjs-universe/references/realtime-and-patterns.md` | yes | Socket.IO patterns and authorization. |
| `.cursor/skills/nestjs-universe/references/testing-and-quality.md` | yes | Vitest unit, integration, and E2E patterns. |

### 1.4 `docs/product/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/product/CONCEPT.md` | yes | Index to the preserved Arabic concept and ADR overrides. |
| `docs/product/REQUIREMENTS.md` | yes | English scope list, including localization and non-goals. |
| `docs/product/FEATURE_CATALOG.md` | yes | Feature-to-module map and deferred items. |
| `docs/product/BUSINESS_LOGIC.md` | yes | Normative behavior for identity, catalog, orders, payments, reviews, jobs. |
| `docs/product/USER_ROLES_AND_PERMISSIONS.md` | yes | Roles and the ten-section permission catalogue. |

### 1.5 `docs/architecture/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/architecture/ARCHITECTURE_DECISIONS.md` | yes | ADR-001 … ADR-016, status and consequences. |
| `docs/architecture/SYSTEM_DESIGN.md` | yes | One-process shape, request path, cross-cutting table. |
| `docs/architecture/MODULES.md` | yes | Module ownership and dependency direction. |
| `docs/architecture/DATA_FLOW.md` | yes | Registration, checkout, shipping/events, subscription, localization flows. |
| `docs/architecture/STATE_MACHINES.md` | yes | Order, payment, subscription, delivery, cancellation states. |
| `docs/architecture/adr/ADR-014-esm-vitest.md` | yes | Native ESM and Vitest decision stub. |
| `docs/architecture/adr/ADR-015-address-limit.md` | yes | Five-active-address decision stub. |
| `docs/architecture/adr/ADR-016-order-status-socketio.md` | yes | Socket.IO order-status decision stub. |

### 1.6 `docs/database/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/database/ERD.md` | yes | Index to the preserved 37-entity ERD v2. |
| `docs/database/DATABASE_DESIGN.md` | yes | Approved schema delta, English columns, constraints, indexes. |
| `docs/database/DATABASE_MIGRATIONS.md` | yes | Migration rules, expand-and-contract, seeds. |

### 1.7 `docs/api/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/api/API_CONVENTIONS.md` | yes | Prefix, envelope, pagination, errors, permissions, auth header. |
| `docs/api/API_ENDPOINTS.md` | yes | Endpoint index, authority, versioning, groups, pagination. |
| `docs/api/ERROR_HANDLING.md` | yes | Stable error codes and the response filter. |
| `docs/api/LOCALIZATION.md` | yes | `Accept-Language`, `*_en` fallback, message catalog, agent language. |
| `docs/api/REALTIME.md` | yes | Socket.IO namespace, authorization, event, operations. |
| `docs/api/swagger.yaml` | yes | Working OpenAPI 3.0.3 contract, version 2.3.0, 6,655 lines. |

### 1.8 `docs/engineering/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/engineering/TECH_STACK.md` | yes | Pinned versions, ESM/Vitest, lint, not-adopted list. |
| `docs/engineering/SECURITY.md` | yes | Auth, authorization, input, abuse, files, platform checklist. |
| `docs/engineering/TESTING_STRATEGY.md` | yes | Vitest layers, required cases, definition of done. |
| `docs/engineering/PERFORMANCE_AND_SCALABILITY.md` | yes | Database, Redis, application, measurement rules. |
| `docs/engineering/BACKGROUND_JOBS.md` | yes | Queues, policy, transactional boundary, expiry, reminder. |
| `docs/engineering/CI_CD.md` | yes | CI stages, CD stages, environments, release verification. |
| `docs/engineering/CODING_STANDARDS.md` | yes | ESM, folder layout, DTOs, transactions, formatting. |
| `docs/engineering/CONFIGURATION_AND_ENVIRONMENT.md` | yes | Required environment variables and provider fail-closed rules. |
| `docs/engineering/LOGGING_AND_MONITORING.md` | yes | What to log, what never to log, alerting gap. |
| `docs/engineering/BACKUP_AND_RECOVERY.md` | yes | Backup before migration, restore drills, Redis role. |

### 1.9 `docs/features/` (22 files)

| Path | Read | One-line purpose |
|---|---|---|
| `docs/features/account.md` | yes | Profile, phone change, password change. |
| `docs/features/addresses.md` | yes | Saved addresses, five-active limit, default address. |
| `docs/features/authentication.md` | yes | Register, OTP, login, refresh, reset. |
| `docs/features/cart.md` | yes | Frontend LocalStorage boundary; no cart API. |
| `docs/features/catalog.md` | yes | Public categories, seasons, grandmas, products, voice QR. |
| `docs/features/categories-and-seasons.md` | yes | Admin category and season writes. |
| `docs/features/customers-admin.md` | yes | Admin customer list and detail. |
| `docs/features/dashboard.md` | yes | Dashboard cards and follow-up lists. |
| `docs/features/delivery-settings.md` | yes | Zones, periods, slots, holidays, settings, countries, companies. |
| `docs/features/events.md` | yes | Event order detail and approval path. |
| `docs/features/gifts.md` | yes | Gift flag and detail on regular, scheduled, shipping orders. |
| `docs/features/grandmas.md` | yes | Grandma profiles, recipes, voice messages, grandma of the month. |
| `docs/features/notifications.md` | yes | In-app notifications and reminder job. |
| `docs/features/orders.md` | yes | Preview, create, list, detail, cancel, fulfillment, Socket.IO. |
| `docs/features/payments.md` | yes | Payment transactions, webhook, refunds. |
| `docs/features/products-and-boxes.md` | yes | Products, images, stock, channels, boxes. |
| `docs/features/reports.md` | yes | Sales, subscriptions, grandma-dues reports. |
| `docs/features/reviews.md` | yes | Per-order-item review and rating aggregate. |
| `docs/features/shipping.md` | yes | Shipping detail, country fee, tracking, `shipped`/`in_transit`. |
| `docs/features/static-pages.md` | yes | Frontend-only static content; no API. |
| `docs/features/subscriptions.md` | yes | Plans, activation, deliveries, cancellation refund. |
| `docs/features/super-admin.md` | yes | Admin management, permissions, settings, payment methods, log. |

### 1.10 `docs/planning/`

| Path | Read | One-line purpose |
|---|---|---|
| `docs/planning/FEATURE_CHANGE_TEMPLATE.md` | yes | Compact evidence-entry template. |
| `docs/planning/IMPLEMENTATION_PLAN.md` | yes | Phase 0–4 plan and checkpoints. |
| `docs/planning/IMPLEMENTATION_PROGRESS.md` | yes | Dated progress log. |
| `docs/planning/IMPLEMENTATION_STATUS.md` | yes | Feature status table; all Not Started. |
| `docs/planning/OPEN_QUESTIONS.md` | yes | Q1–Q15 open/resolved register. |
| `docs/planning/QUALITY_ASSESSMENT.md` | yes | Criterion design, verification, gaps. |
| `docs/planning/REQUIREMENTS_TRACEABILITY.md` | yes | Requirement-to-design matrix. |

---

## 2. Executive summary

| Change | Scope in this report | Net effect |
|---|---|---|
| **C1** Pagination | Every GET collection endpoint | 16 already paginated; 12 more paginate; 8 stay unpaginated as small/seeded; 1 block unresolved; 7 removed by C3. |
| **C2** Arabic only | All bilingual artifacts | Delete `LOCALIZATION.md`, `*_en` columns, `Accept-Language`, English catalogs, locale tests, language setting. New ADR supersedes ADR-009. |
| **C3** Dashboard scope | Delivery/shipping reference data | Remove 3 entities, 7 admin paths, 1 FK; keep 2 fee fields and 1 period table as seeds; nearest-date rule unresolved. |
| **C4** Order review | Reviews feature and schema | Replace per-item with per-order; grandma rating from order ratings; three owner questions. |
| **C5** Full sync | Lifecycle, permissions, sidebar, settings, dashboard, out-of-scope | 22 spec-vs-package conflicts found; the largest is payment-at-checkout and the order-status set. |

The package is not a small delta from the spec. Two structural decisions (ADR-003
payment ordering and ADR-010 permissions) are the opposite of the spec. C5 cannot
be applied by editing text alone; both ADRs must be superseded.

---

## 3. Authority-order conflict (must be resolved first)

`README.md § Authority order` ranks ADRs above `BUSINESS_LOGIC.md`, the concept,
and `swagger.yaml`. The C1–C5 brief says the spec is authoritative for website and
dashboard behavior, while ADRs govern technical decisions.

That is a direct contradiction: under the current README, ADR-003 (payment after
approval) and ADR-010 (ten section permissions) outrank the spec, so C5 could not
be applied without first changing the authority order.

**PROPOSED** — rewrite `README.md § Authority order` as:

1. The Arabic spec for product, website, and dashboard behavior.
2. `docs/product/BUSINESS_LOGIC.md` and `docs/architecture/STATE_MACHINES.md` as the
   English working summary of that behavior.
3. ADRs for technical decisions the spec does not make (module format, test runner,
   pagination mechanics, address limit, Socket.IO, storage, auth tokens).
4. `swagger.yaml` for paths and shapes; if it disagrees with 1–3, fix `swagger.yaml`.
5. The ERD plus `DATABASE_DESIGN.md` for the data model.

Where an ADR contradicts spec behavior, the ADR is superseded in place and a new
ADR records the technical replacement. This report assumes that order.

---

## 4. C1 — Pagination

### 4.1 Rules

| Rule | Source | Label |
|---|---|---|
| Every table and list is paginated, in dashboard and website. | `spec §11 المبادئ العامة` item 11; `spec §11 الترقيم (Pagination) واللغة` | CONFIRMED |
| Dashboard lists: orders, products, grandmas, subscription plans, subscriptions, deliveries, customers, reports, admins, activity log. | `spec §11 الترقيم (Pagination) واللغة` | CONFIRMED |
| Website lists: products, my orders, my subscriptions, notifications. | `spec §11 الترقيم (Pagination) واللغة` | CONFIRMED |
| Filters and search persist while moving between pages. | `spec §11 الترقيم (Pagination) واللغة`; `spec §15 الفلاتر` | CONFIRMED |
| Backend accepts `page` and `limit` and returns `total` and page count in every list API. | `spec §11 الترقيم (Pagination) واللغة`; `spec §28 تحقق Backend الإلزامي` | CONFIRMED |
| Page size is a fixed value set before launch. | `spec §11 الترقيم (Pagination) واللغة` | CONFIRMED |
| Response shape is `{ data, meta: { page, limit, total, total_pages } }`. | `docs/api/API_CONVENTIONS.md § Success bodies`; `docs/api/API_ENDPOINTS.md § Pagination` | CONFIRMED (package) |
| Default 20, maximum 100. | `docs/architecture/ARCHITECTURE_DECISIONS.md § ADR-012`; `docs/api/swagger.yaml § components.parameters.Limit` | CONFIRMED (package) |
| `page < 1`, `limit < 1`, or `limit > 100` is `422`. | `docs/api/API_CONVENTIONS.md § Success bodies`; `docs/api/swagger.yaml § components.parameters.Page` | CONFIRMED (package) |
| No cursor pagination. | C1 brief | PROPOSED |
| Deterministic sort with `id` as the final tie-breaker. | C1 brief | PROPOSED |
| Unpaginated only when the list is small, fixed, and seeded. | C1 brief | PROPOSED |

Note on "fixed page size": the spec says the size is fixed before launch, but also
says the backend accepts `limit`. The package reads this as a default of 20 with a
100 cap (ADR-012). **DERIVED** — keep `page`/`limit`, document 20 as the approved
size, keep 100 as the hard cap. Confirm in Phase 2.

### 4.2 Endpoint decision table

`PAGINATE` = add `page`/`limit` and `PageMeta`. `KEEP` = already paginated.
`KEEP-UNPAGINATED` = small, fixed, or seeded. `REMOVE` = removed by C3.

| Endpoint | Audience | Today | Decision | Reason |
|---|---|---|---|---|
| `GET /categories` | Public | no | KEEP-UNPAGINATED | Three fixed categories (cooked, pantry, boxes) per `spec §2 التصنيفات`. |
| `GET /seasons` | Public | no | PAGINATE | Grows year over year; not fixed. `spec §11` item 11. |
| `GET /grandmas` | Public | yes | KEEP | Already `page`/`limit` + `GrandmaPage`. |
| `GET /products` | Public | yes | KEEP | Already paginated; add `id` tie-breaker to every sort. |
| `GET /delivery-zones` | Public | no | KEEP-UNPAGINATED | Seeded fixed service-zone list; `spec §22 التوصيل المحلي`. |
| `GET /shipping-countries` | Public | no | KEEP-UNPAGINATED | Seeded fixed country list; `spec §22 الشحن الخارجي`. |
| `GET /payment-methods` | Public | no | KEEP-UNPAGINATED | Seeded fixed methods; `spec §5 سياسة الدفع حسب نوع الطلب`. |
| `GET /delivery/availability` | Public | no | KEEP-UNPAGINATED | Bounded 60-day window, object not a table; `spec §9.1`. Rule unresolved (C3). |
| `GET /me/addresses` | Customer | no | KEEP-UNPAGINATED | Hard cap of five; `ADR-015`; `docs/features/addresses.md § 5`. |
| `GET /me/notifications` | Customer | yes | KEEP | Already paginated; `spec §11` lists notifications. |
| `GET /orders` | Customer | yes | KEEP | Already paginated; `spec §11` lists my orders. |
| `GET /subscription-plans` | Customer | yes | KEEP | Already paginated. |
| `GET /subscriptions` | Customer | yes | KEEP | Already paginated; `spec §11` lists my subscriptions. |
| `GET /admin/dashboard` | Admin | no | UNRESOLVED | `spec §11` does not name the home blocks; `spec §14` defines them as lists. Top-N vs paginated is not stated. |
| `GET /admin/orders` | Admin | yes | KEEP | Already paginated; `spec §11` and `spec §15 الفلاتر`. |
| `GET /admin/grandmas` | Admin | yes | KEEP | Already paginated. |
| `GET /admin/grandmas/{grandmaId}/recipes` | Admin | no | PAGINATE | Unbounded per grandma; `spec §19 القائمة والملف`. |
| `GET /admin/grandmas/{grandmaId}/voice-messages` | Admin | no | PAGINATE | Unbounded per grandma; `spec §3.3` allows several recordings. |
| `GET /admin/categories` | Admin | no | KEEP-UNPAGINATED | Same three fixed categories. |
| `GET /admin/seasons` | Admin | no | PAGINATE | Grows over time. |
| `GET /admin/products` | Admin | yes | KEEP | Already paginated. |
| `GET /admin/subscription-plans` | Admin | yes | KEEP | Already paginated. |
| `GET /admin/subscriptions` | Admin | yes | KEEP | Already paginated. |
| `GET /admin/subscription-cancellation-requests` | Admin | yes | KEEP | Already paginated. |
| `GET /admin/subscription-deliveries` | Admin | yes | KEEP | Already paginated; `spec §11` lists deliveries. |
| `GET /admin/customers` | Admin | yes | KEEP | Already paginated; `spec §21`. |
| `GET /admin/reports/sales` | Admin | no | PAGINATE | Returns a `rows` array; `spec §11` lists reports. |
| `GET /admin/reports/subscriptions` | Admin | no | KEEP-UNPAGINATED | Single aggregate object, no list; `spec §24`. |
| `GET /admin/reports/grandma-dues` | Admin | no | PAGINATE | Returns a `rows` array; `spec §11` lists reports. |
| `GET /super-admin/admins` | Super Admin | yes | KEEP | Already paginated. |
| `GET /super-admin/permissions` | Super Admin | no | KEEP-UNPAGINATED | Seeded catalogue of 26 keys; `spec §12`. |
| `GET /super-admin/settings/system` | Super Admin | no | UNRESOLVED | Single object; C5 §26 may remove the route. |
| `GET /super-admin/payment-methods` | Super Admin | no | KEEP-UNPAGINATED | Seeded fixed methods; C5 §26 may remove the route. |
| `GET /super-admin/activity-logs` | Super Admin | yes | KEEP | Already paginated; `spec §11` lists the activity log. |
| `GET /admin/delivery-zones` | Admin | no | REMOVE | C3. |
| `GET /admin/delivery-periods` | Admin | no | REMOVE | C3. |
| `GET /admin/delivery-slots` | Admin | no | REMOVE | C3. |
| `GET /admin/holidays` | Admin | no | REMOVE | C3. |
| `GET /admin/settings/delivery` | Admin | no | REMOVE | C3 (unless the nearest-date rule needs one parameter). |
| `GET /admin/shipping-countries` | Admin | no | REMOVE | C3. |
| `GET /admin/shipping-companies` | Admin | no | REMOVE | C3. |

Count: 16 already paginated, 12 to paginate, 8 keep unpaginated, 2 unresolved,
7 removed.

### 4.3 Deterministic sort

Every list needs a stable order. Today only `/products` documents sort values
(`docs/api/swagger.yaml § paths./products.get`, enum `most_ordered`, `newest`,
`price_asc`, `price_desc`, `rating`). Every other list has no documented sort.

**PROPOSED** — each list gets a whitelisted `sort` (or a fixed server order) and an
`id` tie-breaker:

| List | Primary order | Tie-breaker |
|---|---|---|
| Orders, my orders, notifications, activity log, admins, customers | `created_at DESC` | `id DESC` |
| Products | requested sort; `most_ordered`, `newest`, `price_asc`, `price_desc`, `rating` | `id DESC` |
| Grandmas | `name ASC` | `id ASC` |
| Categories, seasons, zones, countries, periods, payment methods | `name ASC` (or seeded order) | `id ASC` |
| Subscription plans, subscriptions, deliveries, cancellation requests | `created_at DESC` | `id DESC` |
| Reports | `grandma.name ASC`, then `order_type` | `grandma.id ASC` |
| Recipes, voice messages | `created_at DESC` | `id DESC` |

`id` is the integer primary key, so the order is total and stable. Unknown `sort`
values are `422`, matching `docs/features/catalog.md § 9`.

### 4.4 Validation and metadata

- `page` and `limit` are integers; `page >= 1`; `1 <= limit <= 100`; otherwise `422`.
  This matches `docs/api/API_CONVENTIONS.md § Success bodies` and the existing
  `Page`/`Limit` parameters.
- `total_pages = ceil(total / limit)`; when `total = 0`, `total_pages = 0`, matching
  the example envelope in `docs/api/API_CONVENTIONS.md § Success bodies`.
- `page > total_pages` behavior is not stated by the spec. **UNRESOLVED** —
  recommendation: return `data: []` with correct `meta`, not `422`.
- Filters and search are query parameters that the client resends on page change.
  The backend does not persist them. `spec §11` and `spec §15` require that they
  remain applied; that is a client contract, not server state. **CONFIRMED**.

### 4.5 Files to edit for C1

`docs/api/API_CONVENTIONS.md`, `docs/api/API_ENDPOINTS.md`,
`docs/api/swagger.yaml` (add `Page`/`Limit` to the 12 endpoints, add `PageMeta`
wrappers, add `sort` where needed), `docs/architecture/ARCHITECTURE_DECISIONS.md`
(extend ADR-012), `docs/engineering/PERFORMANCE_AND_SCALABILITY.md`,
`docs/features/*` (the list endpoints in each feature), and the traceability matrix.

---

## 5. C2 — Arabic only

### 5.1 What the spec says

- The website and dashboard are Arabic only, RTL, with no language switcher.
  `spec §11 الترقيم (Pagination) واللغة`.
- Status values are technical names in code and the API only; the user sees Arabic
  labels. `spec §11 الترقيم (Pagination) واللغة`.
- The platform name, language, and currency are fixed at launch.
  `spec §26 الإعدادات التي لا تحتاج صفحات في الداشبورد`.

### 5.2 Removal inventory

| Artifact | Current location | Action | Label |
|---|---|---|---|
| `Accept-Language` selection | `docs/api/LOCALIZATION.md § Selection`; `docs/api/API_CONVENTIONS.md § Language`; `docs/architecture/SYSTEM_DESIGN.md § Approved cross-cutting behavior`; `docs/architecture/DATA_FLOW.md § Localization path`; `docs/product/REQUIREMENTS.md § Localization`; `ADR-009` | Remove the header and the interceptor branch; Arabic is the only output. | CONFIRMED |
| `*_en` columns | `docs/database/DATABASE_DESIGN.md § Columns added to existing tables`; `ADR-009`; admin schemas in `swagger.yaml` | Remove all 24 English columns and the admin `*Admin` pairs. | CONFIRMED |
| English message catalog | `docs/api/ERROR_HANDLING.md § Codes`; `docs/api/LOCALIZATION.md § API messages`; `docs/engineering/TESTING_STRATEGY.md § Required cases before Verified` | Keep Arabic messages only; delete the English map and the "both locales" test. | CONFIRMED |
| `LOCALIZATION.md` | `docs/api/LOCALIZATION.md` | Delete the file and every link to it. | CONFIRMED |
| Language switcher | Implied by `ADR-009`; no explicit file | Remove from any frontend note; state "no switcher". | CONFIRMED |
| `SystemSetting.language` | `docs/database/DATABASE_DESIGN.md`; `docs/features/super-admin.md § 9`; `swagger.yaml § SystemSettings`; `PublicSettings` | Remove the field, or freeze it to `ar` and expose it read-only. **UNRESOLVED** (see Q-19). | UNRESOLVED |
| Locale fallback in catalog | `docs/features/catalog.md § 13` and `§ 16`; `docs/product/BUSINESS_LOGIC.md § Catalog rules` | Return `name` only; no fallback. | CONFIRMED |
| Translated seeds | `docs/database/DATABASE_MIGRATIONS.md` seeds; `DATABASE_DESIGN.md` | Seed Arabic only. | CONFIRMED |
| Notification localization | `docs/product/BUSINESS_LOGIC.md § Notifications`; `docs/api/LOCALIZATION.md § Notifications`; `docs/features/notifications.md § 5`; `docs/planning/OPEN_QUESTIONS.md Q10` | Store the Arabic message at insert; delete Q10. | CONFIRMED |
| Locale tests | `docs/features/authentication.md § 16`; `docs/features/catalog.md § 16`; `docs/engineering/TESTING_STRATEGY.md`; `docs/planning/QUALITY_ASSESSMENT.md` | Delete the two-locale cases. | CONFIRMED |
| `language` validation `ar`/`en` | `docs/features/super-admin.md § 9` | Delete. | CONFIRMED |

### 5.3 What stays English

Field names, enums, status codes, error codes, permission keys, database columns,
code, comments, and all documentation remain English. This is required by
`spec §11` ("status values are technical names in code and the API only") and by
`docs/api/LOCALIZATION.md § Agent language`. **CONFIRMED.**

The assumption that `docs/` markdown stays English is **CONFIRMED** by
`docs/api/LOCALIZATION.md § Agent language` ("Code, comments, docs, and agent
instructions stay in English"). Deleting that file must not delete the rule; move
the sentence into `AGENTS.md` or `docs/engineering/CODING_STANDARDS.md`.

### 5.4 Superseding ADR

**PROPOSED — ADR-017 "Arabic-only product surface"**, status Accepted, supersedes
ADR-009. Content: Arabic is the only locale; no `Accept-Language`; no `*_en`
columns; no language setting; no message catalog split; technical names stay
English; docs stay English.

ADR-009 is marked **Superseded by ADR-017** in place, keeping its original text.

### 5.5 Open items for C2

- **Q-19 (UNRESOLVED)** — `SystemSetting.language` and `PublicSettings.language`:
  remove entirely, or keep as a read-only constant `ar`? Recommendation: remove the
  field and state "Arabic" in the public settings description, because there is no
  second value to choose.
- **Q-20 (CONFIRMED)** — English technical names are not "bilingual support"; they
  stay. No action beyond documenting the distinction.

---

## 6. C3 — Dashboard scope reduction (delivery and shipping)

### 6.1 What the spec says

- Local delivery keeps service zones and a fixed fee per zone; the customer picks a
  zone at checkout; the backend validates it and computes the fee.
  `spec §22 التوصيل المحلي`; `spec §9.1 التوصيل المحلي`.
- No multiple weekday tables, no closure periods or holidays per zone, no calendar
  exceptions, no driver distribution, no live tracking, no driver role.
  `spec §22 التوصيل المحلي`; `spec §9.1`.
- Delivery periods are a simple fixed list on the website, not complex tables per
  grandma or zone. `spec §22 المواعيد وتوافق Checkout`; `spec §9.1`.
- The nearest date for a non-scheduled order follows a simple fixed operating rule
  approved before launch; it does not rely on a holiday calendar or automatic
  capacity. `spec §9.1`; `spec §22 المواعيد وتوافق Checkout`.
- Shipping keeps a supported-country list and a fixed fee per country.
  `spec §22 الشحن الخارجي`; `spec §9.2`.
- The admin types the shipping company name and tracking number manually. No
  carrier API and no shipping-company account management.
  `spec §22 الشحن الخارجي`; `spec §9.2`; `spec §29 طلب شحن`.
- Zones, countries, fees, and periods are prepared before launch in system
  settings/database; no separate operational settings page in the dashboard. A
  small screen may be added later if frequent editing becomes necessary.
  `spec §22 مكان إعداد المناطق والبلدان والرسوم`; `spec §26`.
- No holiday calendar, no advanced production calendar, no daily capacity cap.
  `spec §11` item 8; `spec §19 الإجازات والقدرة`; `spec §30`.

### 6.2 Entity and endpoint classification

| Item | Current package | Spec rule | Decision | Label |
|---|---|---|---|---|
| `ShippingCompany` table | `docs/database/ERD.md` base model; `docs/features/delivery-settings.md § 7` | Manual name/tracking, no company accounts (`§9.2`, `§22`, `§29`) | **REMOVE** table; store `OrderShippingDetail.shipping_company_name` as free text. | CONFIRMED |
| `OrderShippingDetail.shipping_company_id` | `swagger.yaml § OrderShippingDetail` | Same | **REMOVE** FK; add `shipping_company_name`. | CONFIRMED |
| `Holiday` table | ERD base model; `delivery-settings.md § 7` | No holiday calendar (`§11.8`, `§19`, `§22`, `§30`) | **REMOVE** table, schema, and `/admin/holidays` paths. | CONFIRMED |
| `DeliverySlot` table | ERD base model | No weekday slot tables (`§9.1`, `§22`) | **REMOVE** table and `/admin/delivery-slots` paths. | CONFIRMED |
| `DeliveryPeriod` table | ERD base model | Simple fixed list, prepared before launch (`§9.1`, `§22`, `§26`) | **KEEP-SEEDED**; remove `/admin/delivery-periods` CRUD. | CONFIRMED |
| `DeliverySetting` + `/admin/settings/delivery` | `swagger.yaml § DeliverySettings`; `delivery-settings.md § 5` | Fixed rule approved before launch; no settings page (`§9.1`, `§26`) | **UNRESOLVED** — keep only if the approved nearest-date rule needs `min_preparation_hours`; otherwise remove. | UNRESOLVED |
| `DeliveryZone.fee` | `swagger.yaml § DeliveryZone` | Fixed fee per zone (`§9.1`, `§22`, `§26`) | **KEEP** as seeded data. | CONFIRMED |
| `ShippingCountry.fee` | `swagger.yaml § ShippingCountry` | Fixed fee per country (`§9.2`, `§22`, `§26`) | **KEEP** as seeded data. | CONFIRMED |
| `/admin/delivery-zones` CRUD | `swagger.yaml` lines 2726–2806 | No operational settings page (`§22`, `§26`) | **REMOVE**; seed zones and fees. | CONFIRMED |
| `/admin/delivery-periods` CRUD | lines 2807–2899 | No operational settings page | **REMOVE**; seed periods. | CONFIRMED |
| `/admin/delivery-slots` CRUD | lines 2900–2964 | No slots | **REMOVE**. | CONFIRMED |
| `/admin/holidays` CRUD | lines 2965–3030 | No holidays | **REMOVE**. | CONFIRMED |
| `/admin/settings/delivery` | lines 3031–3072 | No settings page | **REMOVE** or fold into seed (see `DeliverySetting`). | UNRESOLVED |
| `/admin/shipping-countries` CRUD | lines 3073–3152 | No settings page | **REMOVE**; seed countries and fees. | CONFIRMED |
| `/admin/shipping-companies` CRUD | lines 3153–3240 | No company accounts | **REMOVE**. | CONFIRMED |
| `GET /delivery/availability` | lines 841–883 | Nearest-date rule, fixed and simple (`§9.1`) | **KEEP** endpoint; recompute without slots/holidays; rule unresolved. | UNRESOLVED |
| `GET /delivery-zones` | lines 796–810 | Checkout needs zones and fees | **KEEP**. | CONFIRMED |
| `GET /shipping-countries` | lines 811–825 | Checkout needs countries and fees | **KEEP**. | CONFIRMED |
| `GET /payment-methods` | lines 826–840 | Checkout needs active methods | **KEEP** (seeded). | CONFIRMED |
| `Order.delivery_period_id` | ERD base model | `delivery_period` on the order (`§36`) | **KEEP** as FK to seeded periods. | CONFIRMED |
| Nearest-delivery-date computation | `delivery-settings.md § 5`; `swagger.yaml § DeliveryAvailability` | Fixed rule approved before launch | **UNRESOLVED**. | UNRESOLVED |

### 6.3 Nearest delivery date — unresolved

The package computes availability from `DeliverySlot` weekdays, `Holiday` dates, and
`DeliverySetting.min_preparation_hours`
(`docs/features/delivery-settings.md § 5`;
`docs/api/swagger.yaml § paths./delivery/availability.get`).
C3 removes slots and holidays, so that computation has no inputs.

The spec says only that the rule is "simple and fixed, approved before launch"
(`spec §9.1`; `spec §22 المواعيد وتوافق Checkout`). It does not state:

- which weekdays are deliverable;
- the daily cut-off time;
- whether "nearest" means tomorrow or the next period;
- whether `min_preparation_hours` survives.

**UNRESOLVED — Q-05.** Until the owner states the rule, the package can only say
"return the next deliverable date from the seeded period list, at least
`today + longest lead_time_days`, with no holiday check". That is a placeholder,
not an approved rule. Do not implement a value.

### 6.4 Files to edit for C3

`docs/features/delivery-settings.md` (rewrite or split into
`delivery-reference-data.md`), `docs/features/shipping.md`,
`docs/features/orders.md`, `docs/features/dashboard.md`,
`docs/product/BUSINESS_LOGIC.md § Checkout validation`,
`docs/product/USER_ROLES_AND_PERMISSIONS.md § Permission catalogue` and
`§ Route to section mapping`, `docs/database/DATABASE_DESIGN.md`,
`docs/database/ERD.md` (delta note only; do not edit the original ERD),
`docs/architecture/MODULES.md`, `docs/architecture/DATA_FLOW.md`,
`docs/api/swagger.yaml`, `docs/api/API_ENDPOINTS.md`, and the traceability matrix.

---

## 7. C4 — One review per delivered order

### 7.1 The decision

C4 replaces the spec's per-product review with one review per completed `DELIVERED`
order: 1–5 stars, optional comment, published immediately, no moderation. This is a
product-owner change, so it overrides the spec and needs an ADR.

| Item | Spec | Package today | C4 decision | Label |
|---|---|---|---|---|
| Review unit | Each product in the order, once (`spec §3.9 التقييم`; `§10.4`; `§28`; `§36`) | Each order item, once (`docs/features/reviews.md § 5`; `swagger.yaml § Review`) | One review per order | PROPOSED |
| Route | Not specified | `POST /orders/{orderId}/items/{orderItemId}/review` | `POST /orders/{orderId}/review` | PROPOSED |
| Unique key | — | `order_item_id` | `order_id` | PROPOSED |
| `product_id` on review | `spec §36` includes it | present | remove | PROPOSED |
| Rating | 1–5 stars (`§3.9`) | 1–5 | 1–5 | CONFIRMED |
| Comment | optional (`§3.9`) | optional, max 2000 | optional, max 2000 | CONFIRMED |
| Moderation | none (`§30`; `§37`) | none | none | CONFIRMED |
| Order state | `DELIVERED` (`§3.9`; `§10.4`) | `delivered` | `delivered` | CONFIRMED |
| Grandma `avg_rating` | average of published product reviews (`§3.3`; `§19`) | average of product reviews (`swagger.yaml § Grandma.avg_rating`) | average of her orders' ratings | DERIVED |

### 7.2 Schema and API shape

**PROPOSED:**

```text
Review
  id            integer PK
  order_id      integer FK, unique, not null
  rating        integer 1..5, not null
  comment       text null, max 2000
  published_at  timestamptz, set at creation
  created_at    timestamptz
  updated_at    timestamptz
```

- `OrderItem.review` is removed; `Order.review` becomes nullable.
- `POST /orders/{orderId}/review` returns `201` with the review.
- Errors: `404` if the order is not the customer's; `409` if not `delivered` or a
  review already exists; `422` for rating outside 1–5 or a comment over 2000.
- No edit or delete route (`docs/features/reviews.md § 2`; `§ 19`).
- No admin moderation route (`spec §30`; `spec §37`).

### 7.3 Three questions for the owner

| ID | Question | Recommendation | Label |
|---|---|---|---|
| Q-08 | Product-level rating. `spec §3.2` shows a rating on every product card and `spec §3.2` allows sorting by rating. If reviews belong to orders, how is a product rated? | Derive the product rating from the ratings of delivered orders that contain the product. Keep the `rating` sort. | UNRESOLVED |
| Q-09 | Where do comments appear on the website? `spec §3.4` lists product-detail content and does not include a reviews list. | Store the comment; expose only aggregate ratings; no public comment list. | UNRESOLVED |
| Q-10 | Are subscription deliveries reviewable? `spec §3.9` says the customer rates after an order is `DELIVERED`; subscriptions are a separate entity (`spec §11` item 6; `§38.4`). | Not reviewable; only orders can be reviewed. | UNRESOLVED |

A fourth question is worth confirming: **Q-11** — an order that contains only a box
or a made-to-order item is still one order and gets one review. **PROPOSED.**

### 7.4 Superseding ADR

**PROPOSED — ADR-018 "One review per delivered order"**, status Accepted,
supersedes the rating clause of ADR-007 and the per-item review rule in
`docs/features/reviews.md`. It records the deviation from `spec §3.9`, `§10.4`,
`§28`, and `§36`, and the three open questions above.

### 7.5 Files to edit for C4

`docs/features/reviews.md`, `docs/product/BUSINESS_LOGIC.md § Catalog rules` (the
grandma rating sentence), `docs/product/REQUIREMENTS.md § Catalog`,
`docs/database/DATABASE_DESIGN.md` (Review delta), `docs/database/ERD.md` (delta
note), `docs/api/swagger.yaml` (`Review`, `ReviewInput`, the route, `Order`,
`OrderItem`, `Grandma.avg_rating`, `Product.rating_avg`),
`docs/api/API_ENDPOINTS.md`, `docs/features/catalog.md`,
`docs/features/grandmas.md`, `docs/features/orders.md`,
`docs/planning/REQUIREMENTS_TRACEABILITY.md`, and `docs/planning/OPEN_QUESTIONS.md`.

---

## 8. C5 — Full spec sync

C5 applies every clearly stated spec item that the package contradicts. The items
below are grouped by area. Each carries its spec citation and label.

### 8.1 Order lifecycle and payment timing (largest change)

The spec has one order path and one payment moment:

- Statuses: `PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`,
  plus `CANCELLED`. `spec §10.2 حالات الطلب الموحدة`; `spec §36 Order`.
- Rejection is from `PENDING` only and becomes `CANCELLED` with `cancel_reason`.
  `spec §10.2`; `spec §15 إجراءات الإدارة`.
- Payment status: `UNPAID`, `PAID`, `REFUNDED`. `spec §10.3 حالة الدفع`.
- Electronic payment happens inside Checkout **before the order is created**.
  `spec §5 Checkout – إتمام الطلب`; `spec §5 سياسة الدفع حسب نوع الطلب`.
- Shipping and event orders are electronic-only and must be `PAID` before the admin
  confirms them. `spec §10.2`; `spec §5`; `spec §9.2`; `spec §38.2`; `spec §38.3`.
- There is no payment deadline for shipping or event orders; the deadline remains
  only for subscriptions. `spec §5 مهلة الدفع`.
- Shipping is handed to the carrier at `OUT_FOR_DELIVERY`, where company and
  tracking are entered. `spec §9.2 حالات الشحن`; `spec §29 طلب شحن`.

Package conflicts:

| ID | Package | Spec | Verdict |
|---|---|---|---|
| X-01 | `ADR-003` creates an `awaiting_payment` order before the gateway call; shipping/events stay `pending` until approval, then `awaiting_payment`. `docs/product/BUSINESS_LOGIC.md § Payments`; `docs/architecture/DATA_FLOW.md § Shipping and events`. | Payment is inside Checkout before submission; shipping/events are `PENDING + PAID`. | ADR-003 is superseded. |
| X-02 | `awaiting_payment` is an order status (`STATE_MACHINES.md § Order status`; `swagger.yaml § OrderStatus`). | Not in the spec's status set. | Remove the status. |
| X-03 | `rejected` is a terminal order status (`STATE_MACHINES.md`; `swagger.yaml`). | Rejection is `CANCELLED` with a reason. | Remove `rejected`; keep `cancel_reason`. |
| X-04 | `shipped` and `in_transit` (`STATE_MACHINES.md § Shipping`; `swagger.yaml § OrderStatus`; `shipping.md § 5`). | Shipping uses `OUT_FOR_DELIVERY` then `DELIVERED`. | Remove both statuses. |
| X-05 | `payment_status` includes `failed` (`swagger.yaml § PaymentStatus`; `BUSINESS_LOGIC.md § Payments`). | `UNPAID`, `PAID`, `REFUNDED`. | Remove `failed` from order payment status; keep it on `PaymentTransaction`. |
| X-06 | `Order.payment_deadline` and the `expire-order` job (`BACKGROUND_JOBS.md § Expiry`; `DATA_FLOW.md`; `swagger.yaml § OrderSummary.payment_deadline`). | No order payment deadline; subscription only. | Remove the field and the job; keep `expire-subscription`. |
| X-07 | Approval of shipping/event does not require `PAID` (`swagger.yaml § paths./admin/orders/{orderId}/approve`). | Confirmation requires `PAID`. | Add the guard. |
| X-08 | Dashboard card `awaiting_payment_orders` (`swagger.yaml § DashboardStats`). | Not a spec card. | Remove. |

**UNRESOLVED — Q-13 (technical).** The spec says payment happens before the order
is created, but `POST /payments` currently requires an `order_id` or
`subscription_id` (`swagger.yaml § paths./payments.post`). A parent row must exist
before the gateway call. The package needs a technical design that preserves the
observable behavior (no order visible before payment, no `awaiting_payment`):

- Option A: create the order as `pending`/`unpaid` inside a transaction, call the
  gateway, and only commit on success (long transaction, not recommended).
- Option B: create an internal draft row that is excluded from every list and
  converted to `pending`/`paid` on success; cancel and release on failure.
- Option C: `POST /payments` accepts a checkout payload and creates the order on
  success; this changes the payment contract and ADR-005's "exactly one parent".

Recommendation: Option B, recorded in a new ADR. Do not pick it without approval.

### 8.2 Permissions and sidebar

| ID | Package | Spec | Verdict |
|---|---|---|---|
| X-09 | Ten section permissions, `operation = manage` (`ADR-010`; `USER_ROLES_AND_PERMISSIONS.md § Permission catalogue`). | 26 function-level keys grouped into 7 sections (`spec §12 الصلاحيات في النسخة الأولى`). | Replace the catalogue. |
| X-10 | Edit permission does not require view. | An edit key requires its section's view key; Super Admin grants view automatically (`spec §12 قواعد الصلاحيات`). | Add the rule. |
| X-11 | `events`, `gifts`, and `delivery` are grantable sections. | Only 7 sections: dashboard, orders, products, grandmas, subscriptions, customers, reports (`spec §12`; `spec §13`). No independent shipping, events, gifts, boxes, settings, payment, commission, or holidays sections (`spec §13`). | Remove the three sections; event/gift orders are filters on the orders table (`spec §11` item 1; `spec §15`). |
| X-12 | Dashboard uses `any-admin` (`swagger.yaml § /admin/dashboard`). | Three dashboard keys: `dashboard.view_stats`, `dashboard.view_attention_orders`, `dashboard.view_upcoming_deliveries` (`spec §14 الصلاحيات في الرئيسية`). | Replace `any-admin` with per-block checks. |
| X-13 | Every admin route declares a section, not a function. | Every API and every dashboard button is tied to a specific key (`spec §12 قواعد الصلاحيات`). | Replace `x-required-permission` values with keys. |

**PROPOSED — ADR-019 "Function-level permissions in seven sections"**, supersedes
ADR-010. Seed 26 keys:

| Section | Keys |
|---|---|
| Dashboard | `dashboard.view_stats`, `dashboard.view_attention_orders`, `dashboard.view_upcoming_deliveries` |
| Orders | `orders.view`, `orders.accept_reject`, `orders.update_status`, `orders.cancel`, `orders.manage_payment_shipping` |
| Products | `products.view`, `products.create_edit`, `products.manage_price_stock`, `products.manage_availability_publish` |
| Grandmas | `grandmas.view`, `grandmas.create_edit`, `grandmas.change_status`, `grandmas.set_of_month` |
| Subscriptions | `subscriptions.view`, `subscriptions.manage_plans`, `subscriptions.view_deliveries`, `subscriptions.update_delivery_status` |
| Customers | `customers.view`, `customers.view_addresses`, `customers.view_orders_subscriptions` |
| Reports | `reports.orders_sales`, `reports.subscriptions`, `reports.grandma_dues` |

`spec §36 AdminPermission` confirms one `permission_key` per record. The current
`Permission` + `UserPermission` model becomes a catalogue of 26 keys and a
many-to-many assignment.

**UNRESOLVED — Q-12.** The spec's key list does not name a key for order refunds,
subscription refunds, or cancellation-request approve/reject. Recommendation:
refunds and cancellation decisions use `orders.manage_payment_shipping` and
`subscriptions.update_delivery_status` respectively. Confirm.

**UNRESOLVED — Q-17.** Category and season admin writes have no key in `spec §12`
and no section in `spec §13`. Recommendation: keep them under
`products.create_edit`, or seed categories and drop the admin writes. Confirm.

### 8.3 Settings that do not need dashboard pages

`spec §26` lists platform name/language/currency, payment methods, subscription
payment deadline, commission rate, delivery zones/fees, shipping countries/fees,
and delivery periods as values fixed before launch. It says there is no system,
payment, or commission settings page in the simplified version.

| ID | Package | Spec | Verdict |
|---|---|---|---|
| X-14 | `/super-admin/settings/system` and `/super-admin/payment-methods` (`swagger.yaml`; `docs/features/super-admin.md § 5`). | No settings page; values fixed before launch (`spec §26`). | **UNRESOLVED — Q-16.** Recommendation: seed the `SystemSetting` row and `PaymentMethod` rows; keep read-only access if the dashboard needs to display them; remove the write routes. |
| X-15 | `/admin/settings/delivery` (`swagger.yaml`). | No delivery settings page (`spec §22`; `spec §26`). | Remove or fold into seed (see C3). |

### 8.4 Dashboard cards and lists

`spec §14 بطاقات الملخص` defines five cards: new `PENDING` orders, `PREPARING`
orders, upcoming or due-today deliveries, active subscriptions, unavailable
products. `spec §14 قوائم المتابعة` defines: orders needing action (`PENDING` with
payment status, preparation due/approaching, due today), latest orders, upcoming
deliveries.

| ID | Package | Spec | Verdict |
|---|---|---|---|
| X-16 | `DashboardStats` has `total_orders`, `new_shipping_orders`, `new_event_orders`, `awaiting_payment_orders` (`swagger.yaml § DashboardStats`; `docs/features/dashboard.md § 5`). | Five cards above. | Remove the four extra counters. |
| X-17 | `needs_attention` has `payment_deadline_approaching` (`swagger.yaml § Dashboard`). | No order payment deadline. | Remove. |
| X-18 | `needs_attention.out_of_stock_products` is a follow-up list. | Unavailable products is a card; the follow-up lists are orders and deliveries. | Move it to the card or remove the duplicate list. **DERIVED.** |
| X-19 | Dashboard has no permission of its own (`docs/features/dashboard.md § 4`). | Three dashboard keys per block (`spec §14`). | Replace. |

`spec §14` also says clicking a card opens the matching section with a filter
applied. That is a frontend behavior; the API needs the filter parameters that
already exist on `/admin/orders` and `/admin/products`. **CONFIRMED.**

### 8.5 Out-of-scope lists

`spec §30` and `spec §37` match the package's deferred list in
`docs/product/FEATURE_CATALOG.md § Deferred` almost item for item: no grandma
accounts, no holiday or production calendar, no complex delivery schedules, no
driver role or GPS, no carrier API, no per-country shipping eligibility, no event
quotes, no full accounting or automatic payouts, no coupons, no CMS, no review
moderation, no separate system/payment/commission pages.

Two items need a check:

- `spec §30` says "no separate settings pages for system, payment, and commission";
  the package has them (X-14). **CONFIRMED conflict.**
- `spec §37` says "no review moderation section to hide violating reviews"; the
  package has none. **CONFIRMED match.**

### 8.6 Other spec deltas

| ID | Package | Spec | Verdict |
|---|---|---|---|
| X-20 | `shipping_eligible` is absent; `channel_shipping` is the eligibility flag (`swagger.yaml § Product`; `BUSINESS_LOGIC.md § Catalog rules`). | `spec §36` lists both `channel_shipping` and `shipping_eligible`; `spec §9.2` says eligibility is one field. | **UNRESOLVED — Q-14.** Recommendation: `channel_shipping` is the single field; do not add `shipping_eligible`. |
| X-21 | Customer cancellation windows: regular/scheduled in `pending` or `confirmed`; shipping/event in `pending` or `awaiting_payment` (`ADR-006`; `STATE_MACHINES.md`). | Spec is silent on customer windows; rejection is from `PENDING` only (`spec §10.2`; `spec §15`). | **DERIVED** — keep ADR-006 minus `awaiting_payment`; shipping/event cancel from `pending` only. |
| X-22 | `NotificationType` includes `order_rejected` (`swagger.yaml`). | Notifications cover cancellation or rejection with reason (`spec §27`). | Keep the code; it describes the event, not a status. **DERIVED.** |
| X-23 | `OrderStatus.cancelled_or_rejected` tab (`swagger.yaml § CustomerOrderTab`). | One `CANCELLED` status. | Rename to `cancelled`. **DERIVED.** |
| X-24 | `GET /admin/orders?sort=payment_deadline` (`swagger.yaml`). | No order deadline. | Remove the sort value. **DERIVED.** |
| X-25 | `OrderSummary.payment_deadline` and `Order.payment_deadline` (`swagger.yaml`). | Subscription only. | Remove from orders. **DERIVED.** |
| X-26 | `Grandma.avg_rating` is computed from product reviews (`swagger.yaml § Grandma.avg_rating`). | C4 changes the source to order ratings. | Superseded by ADR-018. |
| X-27 | `Product.rating_avg` is computed from `Review` (`swagger.yaml § Product.rating_avg`). | `spec §3.2` requires a product card rating. | Keep the field; change the derivation (Q-08). **UNRESOLVED.** |
| X-28 | `docs/features/reviews.md` says one review per order item. | C4 says one per order. | Rewrite. **PROPOSED.** |
| X-29 | `docs/features/shipping.md § 5` says the path uses `shipped` and `in_transit`. | Shipping uses `OUT_FOR_DELIVERY` then `DELIVERED`. | Rewrite. **CONFIRMED.** |
| X-30 | `docs/features/events.md § 15` says approval moves to `awaiting_payment`. | Approval moves to `CONFIRMED` only when `PAID`; the order is already `PAID`. | Rewrite. **CONFIRMED.** |
| X-31 | `docs/features/orders.md § 12` runs `expire-order` for electronic `awaiting_payment` orders. | No order expiry. | Remove. **CONFIRMED.** |
| X-32 | `docs/features/payments.md § 6` creates a payment after the order exists. | Payment is before order creation. | Redesign (Q-13). **UNRESOLVED.** |

### 8.7 C5 edit list

`docs/product/BUSINESS_LOGIC.md`, `REQUIREMENTS.md`,
`USER_ROLES_AND_PERMISSIONS.md`, `FEATURE_CATALOG.md`;
`docs/architecture/STATE_MACHINES.md`, `SYSTEM_DESIGN.md`, `DATA_FLOW.md`,
`MODULES.md`, `ARCHITECTURE_DECISIONS.md`;
`docs/database/DATABASE_DESIGN.md`, `ERD.md`, `DATABASE_MIGRATIONS.md`;
`docs/api/swagger.yaml`, `API_ENDPOINTS.md`, `API_CONVENTIONS.md`,
`ERROR_HANDLING.md`, `LOCALIZATION.md` (delete), `REALTIME.md` (no change);
`docs/features/*` (all 22, with the largest rewrites in orders, shipping, events,
payments, reviews, dashboard, delivery-settings, super-admin, catalog);
`docs/engineering/BACKGROUND_JOBS.md`, `TESTING_STRATEGY.md`,
`PERFORMANCE_AND_SCALABILITY.md`, `SECURITY.md`;
`docs/planning/*`; `.cursor/rules/api.mdc`, `architecture.mdc`, `database.mdc`,
`security.mdc`, `testing.mdc`, `performance.mdc`, `realtime.mdc`;
`.cursor/skills/monat-feature-workflow/SKILL.md`,
`.cursor/skills/nestjs-universe/references/auth-and-security.md`;
`AGENTS.md`; `README.md`.

---

## 9. Spec-vs-package conflict register

| ID | Spec | Package | Verdict | Action |
|---|---|---|---|---|
| X-01 | Payment inside Checkout before submission (`§5`, `§10.2`, `§9.2`, `§38.2`, `§38.3`) | ADR-003: order first, then payment; shipping/events after approval | Spec wins | Supersede ADR-003 (ADR-020); redesign payment (Q-13) |
| X-02 | No `awaiting_payment` status (`§10.2`, `§36`) | `awaiting_payment` | Spec wins | Remove status |
| X-03 | Rejection = `CANCELLED` + reason (`§10.2`, `§15`) | `rejected` status | Spec wins | Remove status |
| X-04 | Shipping = `OUT_FOR_DELIVERY` then `DELIVERED` (`§9.2`, `§29`) | `shipped`, `in_transit` | Spec wins | Remove statuses |
| X-05 | Payment status = `UNPAID`/`PAID`/`REFUNDED` (`§10.3`) | adds `failed` | Spec wins | Remove from order enum |
| X-06 | No order payment deadline (`§5`) | `Order.payment_deadline`, `expire-order` | Spec wins | Remove |
| X-07 | Shipping/event confirm only when `PAID` (`§10.2`, `§15`) | approval does not check | Spec wins | Add guard |
| X-08 | Five dashboard cards (`§14`) | eight counters | Spec wins | Remove extras |
| X-09 | 26 function keys, 7 sections (`§12`) | 10 `manage` sections | Spec wins | ADR-019 |
| X-10 | Edit requires view (`§12`) | no rule | Spec wins | Add rule |
| X-11 | No shipping/events/gifts sections (`§13`) | three grantable sections | Spec wins | Remove |
| X-12 | Three dashboard keys (`§14`) | `any-admin` | Spec wins | Replace |
| X-13 | Every API tied to a key (`§12`) | section-level | Spec wins | Replace `x-required-permission` |
| X-14 | No system/payment/commission pages (`§26`) | `/super-admin/settings/system`, `/super-admin/payment-methods` | Spec wins | Remove writes or seed (Q-16) |
| X-15 | No delivery settings page (`§22`, `§26`) | `/admin/settings/delivery` | Spec wins | Remove or seed |
| X-16 | No holiday calendar (`§11.8`, `§19`, `§22`, `§30`) | `Holiday` + `/admin/holidays` | Spec wins | Remove |
| X-17 | No weekday slot tables (`§9.1`, `§22`) | `DeliverySlot` + `/admin/delivery-slots` | Spec wins | Remove |
| X-18 | No shipping-company accounts (`§9.2`, `§22`) | `ShippingCompany` + CRUD | Spec wins | Remove; free-text name |
| X-19 | Arabic only, no switcher (`§11`) | `Accept-Language`, `*_en`, ADR-009 | Spec wins | ADR-017 |
| X-20 | No moderation (`§30`, `§37`) | none | Match | None |
| X-21 | Product review (`§3.9`, `§36`) | per order item | C4 overrides | ADR-018 |
| X-22 | Grandma rating from product reviews (`§3.3`, `§19`) | from product reviews | C4 overrides | ADR-018 |
| X-23 | `shipping_eligible` and `channel_shipping` both listed (`§36`); one field (`§9.2`) | `channel_shipping` only | Spec-internal ambiguity | Q-14 |
| X-24 | Customer cancel windows unstated | ADR-006 | ADR governs | Keep minus `awaiting_payment` |
| X-25 | Authority order: spec first for behavior | README: ADRs first | Brief overrides | Rewrite README |

---

## 10. Open questions to add to `docs/planning/OPEN_QUESTIONS.md`

These are new. Existing Q1–Q15 stay unless marked otherwise. Q10 (job locale) is
closed by C2.

| ID | Question | Recommendation | Impact |
|---|---|---|---|
| Q-01 | Are the dashboard home blocks paginated or capped top-N? | `latest_orders` = 10 newest; `upcoming_deliveries` = next 7 days, max 20; no page params. | Blocks `GET /admin/dashboard` final shape. |
| Q-02 | What does `page > total_pages` return? | `data: []` with correct `meta`, not `422`. | Pagination tests. |
| Q-03 | Confirm the `id` tie-breaker for every list sort. | Yes; `id DESC` for time sorts, `id ASC` for name sorts. | Stable pagination. |
| Q-05 | What is the fixed nearest-delivery-date rule after removing slots and holidays? | Owner must state weekdays, cut-off, and whether `min_preparation_hours` survives. | Blocks `/delivery/availability`, non-scheduled `delivery_date`/`delivery_period`, and `DeliverySetting`. |
| Q-06 | Keep `DeliveryPeriod` as seeded data? | Yes; simple fixed list per `§9.1`/`§22`/`§26`. | Order and availability shapes. |
| Q-07 | Keep `DeliverySetting.min_preparation_hours`? | Only if Q-05 uses it; otherwise remove. | Schema and availability. |
| Q-08 | How is a product rated under order-level reviews? | Average of delivered orders containing the product; keep the `rating` sort. | `Product.rating_avg`, product card, sort. |
| Q-09 | Where do review comments appear on the website? | No public comment list; aggregate ratings only. | Review response and catalog schemas. |
| Q-10 | Are subscription deliveries reviewable? | No; only orders. | Reviews scope. |
| Q-11 | Is one review correct for an order with only a box or made-to-order item? | Yes; one per order. | Review uniqueness. |
| Q-12 | Which keys cover refunds and cancellation decisions? | `orders.manage_payment_shipping`, `subscriptions.update_delivery_status`. | Permission guards. |
| Q-13 | How is payment taken before the order row exists? | Internal draft row (Option B) recorded in an ADR. | Payments, orders, webhook, tests. |
| Q-14 | Is `shipping_eligible` a second field or the same as `channel_shipping`? | One field: `channel_shipping`. | Product schema. |
| Q-15 | Does order `payment_status` keep `failed`? | No; `failed` stays on `PaymentTransaction`. | Enums and state machine. |
| Q-16 | Remove or seed `/super-admin/settings/system` and `/super-admin/payment-methods`? | Seed values; remove writes; keep read if the dashboard displays them. | Super Admin scope, `§26`. |
| Q-17 | Where do category and season admin writes belong? | Under `products.create_edit`, or seed categories and drop writes. | Permissions, catalog admin. |
| Q-18 | Confirm ADR-006 cancellation windows after removing `awaiting_payment`. | Regular/scheduled `pending` or `confirmed`; shipping/event `pending` only. | `can_cancel`, state machine. |
| Q-19 | Remove `SystemSetting.language` and `PublicSettings.language`, or freeze to `ar`? | Remove; Arabic is the only value. | Settings, public payload. |

Closed by C2: existing Q10 (customer language for jobs). Closed by C4: none of the
existing questions; the review rule was never an open question.

---

## 11. Phase 2 edit order (after approval)

1. **Preserve the source.** Copy the v2 spec unmodified to
   `originals/Monet_AlJaddat_Complete_Merged_Spec_v2.md`. Replace
   `docs/product/CONCEPT.md` with the spec text plus C4 applied, or keep
   `CONCEPT.md` as an index to the new original. Confirm which the owner wants.
2. **ADRs.** Add ADR-017 (Arabic only), ADR-018 (order review), ADR-019
   (function permissions), ADR-020 (payment at checkout and status set), ADR-021
   (delivery reference data seeded), ADR-022 (pagination determinism). Mark
   ADR-003, ADR-007 (rating clause), ADR-009, and ADR-010 as superseded in place.
   Extend ADR-012.
3. **Product docs.** `BUSINESS_LOGIC.md`, `REQUIREMENTS.md`,
   `USER_ROLES_AND_PERMISSIONS.md`, `FEATURE_CATALOG.md`.
4. **Architecture.** `STATE_MACHINES.md`, `SYSTEM_DESIGN.md`, `DATA_FLOW.md`,
   `MODULES.md`.
5. **Database.** `DATABASE_DESIGN.md`, `ERD.md` (delta note), `DATABASE_MIGRATIONS.md`.
6. **API.** `swagger.yaml` (major bump to 3.0.0 because endpoints and enums are
   removed), `API_ENDPOINTS.md`, `API_CONVENTIONS.md`, `ERROR_HANDLING.md`,
   delete `LOCALIZATION.md`.
7. **Features.** Rewrite the 10 affected features; adjust the other 12.
8. **Engineering.** `BACKGROUND_JOBS.md`, `TESTING_STRATEGY.md`,
   `PERFORMANCE_AND_SCALABILITY.md`, `SECURITY.md`.
9. **Planning.** `IMPLEMENTATION_STATUS.md`, `IMPLEMENTATION_PROGRESS.md`,
   `REQUIREMENTS_TRACEABILITY.md`, `QUALITY_ASSESSMENT.md`,
   `OPEN_QUESTIONS.md`, `IMPLEMENTATION_PLAN.md`.
10. **Agent layer.** `.cursor/rules/*` and
    `.cursor/skills/monat-feature-workflow/SKILL.md`,
    `.cursor/skills/nestjs-universe/references/auth-and-security.md`.
11. **Root.** `AGENTS.md` (keep short; add the Arabic-only rule and the spec-first
    authority note), `README.md` (authority order, package map, version).

---

## 12. Phase 3 verification plan

Run after the Phase 2 edits. Paste the exact command and output, not a summary.

```powershell
# 1. Bilingual artifacts
rg -n --glob '!originals/**' --glob '!node_modules/**' '_en\b|Accept-Language|LOCALIZATION|bilingual' .
# 2. Per-item review artifacts
rg -n --glob '!originals/**' --glob '!node_modules/**' 'order_item_id|/items/' .
# 3. Removed delivery artifacts
rg -n --glob '!originals/**' --glob '!node_modules/**' 'holiday|delivery-period|delivery-slot|shipping-companies' .
# 4. Old pagination name
rg -n --glob '!originals/**' --glob '!node_modules/**' 'page_size' .
# 5. Removed statuses
rg -n --glob '!originals/**' --glob '!node_modules/**' 'awaiting_payment|in_transit|shipped|\brejected\b' .
# 6. OpenAPI lint
npm run api:lint
# 7. Relative markdown links
npx --yes markdown-link-check -q "docs/**/*.md"
```

Expected results:

- Checks 1–5 return no hits outside `originals/` (which is preserved history).
- `npm run api:lint` passes with `redocly.yaml`.
- The link check reports no broken relative links.
- `git diff --stat` shows only the files listed in section 11.

If `rg` is unavailable, use the equivalent `Select-String` command and say so in
the progress log.

---

## 13. Approval gate

Phase 1 ends here. Nothing outside this file has been edited.

To proceed, the owner must approve:

1. The spec-first authority order in section 3.
2. C1 decisions in section 4.2, especially the 12 endpoints to paginate and the
   dashboard block question.
3. C2 removal inventory in section 5.2, including deleting `LOCALIZATION.md` and
   all `*_en` columns.
4. C3 classifications in section 6.2, and the nearest-date rule in Q-05.
5. C4 route and schema in section 7.2, and answers to Q-08, Q-09, Q-10.
6. C5 conflicts in section 8, especially X-01 (payment timing) and X-09
   (permissions), which change the contract and the ADR set.
7. The Phase 2 edit order in section 11, including the Swagger 3.0.0 bump.

Until then, `docs/planning/IMPLEMENTATION_STATUS.md` stays unchanged and every
feature stays Not Started.
