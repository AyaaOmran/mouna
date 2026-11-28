# User roles and permissions

Source: `spec §12` (permissions), `spec §13` (sidebar), `spec §14` (dashboard keys). The catalogue is fixed by [ADR-019](../architecture/ARCHITECTURE_DECISIONS.md#adr-019-function-level-permissions-in-seven-sections).

## Roles

`User.role` is `customer`, `admin`, or `super_admin`. There is no `Role` table. The Super Admin screen labeled roles and permissions edits `Permission` and `UserPermission` rows for an admin user.

| Role | Access |
|---|---|
| Guest | Public catalog, public settings, delivery reference data, voice QR. No cart, order, or subscription. |
| Customer | Own account, addresses, orders, subscriptions, notifications, reviews. |
| Admin | Admin routes whose specific function key the user holds. |
| Super Admin | Every admin check, plus admin accounts, permission assignment, and the activity log. |

A customer who requests another customer's resource receives 404. An admin without the function key receives 403. Unauthenticated protected routes receive 401.

## Permission catalogue

One `Permission` row per key. `UserPermission` assigns keys to an admin. Holding a key allows exactly that function.

| Section | Keys | Covers |
|---|---|---|
| Dashboard | `dashboard.view_stats` | Summary cards |
| | `dashboard.view_attention_orders` | Orders needing action |
| | `dashboard.view_upcoming_deliveries` | Upcoming deliveries |
| Orders | `orders.view` | Order list and detail |
| | `orders.accept_reject` | Accept or reject a `pending` order |
| | `orders.update_status` | Fulfillment status moves |
| | `orders.cancel` | Admin cancellation |
| | `orders.manage_payment_shipping` | Payment status, shipping company and tracking, order refunds |
| Products | `products.view` | Product, box, category, and season reads |
| | `products.create_edit` | Create or edit products, boxes, categories, seasons |
| | `products.manage_price_stock` | Price and stock changes |
| | `products.manage_availability_publish` | Availability and publish state |
| Grandmas | `grandmas.view` | Grandma list and detail, recipes, voice messages |
| | `grandmas.create_edit` | Create or edit grandma, recipes, voice messages |
| | `grandmas.change_status` | Active, pending, unavailable |
| | `grandmas.set_of_month` | Grandma of the month |
| Subscriptions | `subscriptions.view` | Plans, subscriptions, cancellation requests |
| | `subscriptions.manage_plans` | Create or edit plans |
| | `subscriptions.view_deliveries` | Delivery list and detail |
| | `subscriptions.update_delivery_status` | Delivery status, cancellation decisions, subscription refunds |
| Customers | `customers.view` | Customer list and profile |
| | `customers.view_addresses` | Saved addresses |
| | `customers.view_orders_subscriptions` | A customer's orders and subscriptions |
| Reports | `reports.orders_sales` | Orders and sales report |
| | `reports.subscriptions` | Subscriptions report |
| | `reports.grandma_dues` | Grandma dues report |

Rules (`spec §12`):

- An edit key requires the matching `*.view` key. The Super Admin assignment screen grants the view key automatically when an edit key is selected.
- Every API and every dashboard button checks a specific key.
- Super Admin bypasses every key and is the only role for admin management and the activity log.
- There is no `events`, `gifts`, `delivery`, `categories`, `boxes`, or `settings` key. Event and gift orders are filters on the single orders table.
- Delivery zones, periods, countries, and settings are seeded before launch, so they have no admin keys (ADR-021).

Seed these 26 rows in a migration. Do not add keys without a new ADR.

## Route to key mapping

`swagger.yaml` uses these keys in `x-required-permission`. An array means OR.

| Routes | Key |
|---|---|
| `GET /admin/dashboard` | Any of the three `dashboard.*` keys; blocks the caller cannot view are omitted |
| `GET /admin/orders`, `GET /admin/orders/{id}` | `orders.view` |
| `POST /admin/orders/{id}/approve`, `/reject` | `orders.accept_reject` |
| `PATCH /admin/orders/{id}/status` | `orders.update_status` |
| `POST /admin/orders/{id}/cancel` | `orders.cancel` |
| `PATCH /admin/orders/{id}` (payment status), `PUT /admin/orders/{id}/shipping`, `POST /admin/orders/{id}/refunds` | `orders.manage_payment_shipping` |
| `GET /admin/products*`, `/admin/categories*`, `/admin/seasons*` | `products.view` |
| `POST`/`PUT` product, box, category, season | `products.create_edit` |
| Product or box price and stock fields | `products.manage_price_stock` |
| Product availability and publish fields | `products.manage_availability_publish` |
| `GET /admin/grandmas*`, `/admin/grandmas/{id}/recipes`, `/admin/grandmas/{id}/voice-messages` | `grandmas.view` |
| Grandma, recipe, voice-message create or edit | `grandmas.create_edit` |
| Grandma status change | `grandmas.change_status` |
| Grandma of the month | `grandmas.set_of_month` |
| `GET /admin/subscription-plans*`, `/admin/subscriptions*`, cancellation requests | `subscriptions.view` |
| Plan create or edit | `subscriptions.manage_plans` |
| `GET /admin/subscription-deliveries*` | `subscriptions.view_deliveries` |
| Delivery status change, cancellation decision, subscription refund | `subscriptions.update_delivery_status` |
| `GET /admin/customers`, `GET /admin/customers/{id}` | `customers.view` |
| `GET /admin/customers/{id}/addresses` | `customers.view_addresses` |
| `GET /admin/customers/{id}/orders`, `/subscriptions` | `customers.view_orders_subscriptions` |
| `GET /admin/reports/sales` | `reports.orders_sales` |
| `GET /admin/reports/subscriptions` | `reports.subscriptions` |
| `GET /admin/reports/grandma-dues` | `reports.grandma_dues` |
| `/super-admin/*` | Super Admin only |

## Activity log

Write an `ActivityLog` row for successful admin and super-admin mutations: actor, action name, entity type, entity id, time. Do not log secrets or full payment payloads.
