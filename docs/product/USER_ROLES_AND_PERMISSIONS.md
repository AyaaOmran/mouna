# User roles and permissions

## Roles

`User.role` is `customer`, `admin`, or `super_admin`. There is no `Role` table. The Super Admin screen labeled roles and permissions edits `Permission` and `UserPermission` rows for an admin user.

| Role | Access |
|---|---|
| Guest | Public catalog, public settings, delivery reference data, voice QR. No cart, order, or subscription. |
| Customer | Own account, addresses, orders, subscriptions, notifications, reviews. |
| Admin | Admin routes where the user holds that section permission. |
| Super Admin | Every admin check, plus admin accounts, permissions, system settings, payment settings, commission, and the activity log. |

A customer who requests another customer's resource receives 404. An admin without the section permission receives 403. Unauthenticated protected routes receive 401.

## Permission catalogue

Approved v1 catalogue. One row per area. `Permission.operation` is `manage`. Holding the row allows every operation in that area. The dashboard is any authenticated admin and has no permission row.

| section | Covers |
|---|---|
| `grandmas` | Grandma profile, recipes, voice messages, grandma of the month |
| `products` | Products, images, boxes, box items, stock, channels |
| `categories` | Categories and seasons |
| `orders` | All order types, approval, rejection, status, shipment, cancel, order refunds |
| `subscriptions` | Plans, subscriptions, cancellation decisions, deliveries, subscription refunds |
| `events` | Read-only filtered event-order view. Mutations use `orders` |
| `delivery` | Zones, periods, slots, holidays, delivery settings, countries, companies |
| `gifts` | Read-only filtered gift-order view. Mutations use `orders` |
| `customers` | Customer account read |
| `reports` | Sales, subscriptions, grandma dues |

Super Admin only, not grantable: create and edit admins, assign permissions, system settings, payment methods and payment deadline, commission rate, activity log.

Seed these ten rows in a migration. Do not add operation-level rows unless a later ADR says so.

## Route to section mapping

`swagger.yaml` uses these names in `x-required-permission`. A route needs the section listed, or the Super Admin role.

| Routes | Section |
|---|---|
| `GET /admin/dashboard` | Any authenticated admin |
| `/admin/grandmas*`, `/admin/recipes*`, `/admin/voice-messages*` | `grandmas` |
| `/admin/products*` (boxes are created and edited here with the `box` object) and product images | `products` |
| `GET /admin/categories`, `GET /admin/seasons` | `products` or `categories` (read-only reference data for the product form) |
| Category and season create/update routes | `categories` |
| Admin order mutations (note, approve, reject, status, shipment, cancel, refunds) | `orders` |
| `GET /admin/orders` and `GET /admin/orders/{id}` | `orders`, or `events` (results/details limited to `order_type = event`), or `gifts` (results/details limited to `is_gift = true`) |
| `/admin/subscription-plans*`, `/admin/subscriptions*`, cancellation requests, subscription deliveries, subscription refunds | `subscriptions` |
| `/admin/delivery-zones*`, `/admin/delivery-periods*`, `/admin/delivery-slots*`, `/admin/holidays*`, `/admin/settings/delivery`, `/admin/shipping-countries*`, `/admin/shipping-companies*` | `delivery` |
| `/admin/customers*` | `customers` |
| `/admin/reports/*` | `reports` |
| `/super-admin/*` | Super Admin only |

No mutation accepts `events` or `gifts`. The canonical section name for delivery settings is `delivery`. There is no `boxes_gifts` section.

## Activity log

Write an `ActivityLog` row for successful admin and super-admin mutations: actor, action name, entity type, entity id, time. Do not log secrets or full payment payloads.
