# Business logic

Normative behavior for implementation. The Arabic v2 spec is the source for product, website, and dashboard behavior; ADRs govern technical decisions. This file is the English working summary. Section numbers in `spec §N` refer to the v2 spec preserved under `originals/`.

## Identity

Registration collects first name, last name, phone, password, and confirmation, plus terms acceptance. The account is created only after the OTP succeeds. Login is phone and password. Password reset and phone change require OTP. Logout revokes the refresh token.

Access tokens last 15 minutes. Refresh tokens are opaque, stored only as a hash, last 30 days, rotate on refresh, and are revoked on logout. OTP is 6 digits, expires in 5 minutes, and allows 5 attempts. Passwords use Argon2id. The cost parameters are an open item in [OPEN_QUESTIONS.md](../planning/OPEN_QUESTIONS.md). Empty passwords are rejected. Password and confirmation must match. A stronger length rule is not defined.

Phone uniqueness is required. A canonical phone format is not defined. Store the verified string and do not guess a country code.

Disabled users cannot authenticate.

The customer address book allows at most **5 active saved addresses** per customer (`deleted_at IS NULL`). Soft-deleted addresses retained for order/subscription history do not count. This cap does not apply to recipient address data entered for event, gift, or external-shipping orders. Creating a sixth active saved address returns `409 ADDRESS_LIMIT_REACHED`.

## Catalog rules

- Public lists return `active` products and `active` grandmas only. Draft and hidden products, and pending or unavailable grandmas, are admin-only.
- Availability shown to customers is computed: in stock, made to order, or unavailable. It is not a stored status.
- Grandma `avg_rating` is the average of the ratings of her **delivered orders** (ADR-018). Customers do not rate a grandma directly.
- Product `rating_avg` is the average of the ratings of delivered orders that contain the product. The product card shows it and the `rating` sort uses it (`spec §3.2`).
- Review comments are stored but not exposed as a public list. The product page has no reviews list in the spec (`spec §3.4`).
- Season status is computed from start and end dates: upcoming, active, ended.
- Made to order requires `lead_time_days > 0` and `allow_scheduling = true`.
- `channel_shipping` is the single shipping-eligibility field. It cannot be set when the category is cooked food (`spec §9.2`).
- A box can be marked shippable only when every content item is shippable.
- Exactly one grandma can be grandma of the month.
- Home banners and static pages are not database content.

## Checkout validation

`POST /orders/preview` and `POST /orders` both re-check:

- Products are active. Ready items and boxes have enough stock. Made-to-order items need no stock quantity.
- Prices match the current catalog. A mismatch returns 409 with a fresh preview. The order is created only after the client accepts the new total.
- All items match the requested channel and the same grandma. That grandma is active.
- Local orders use an active delivery zone with its fixed `fee`. Shipping orders use an active country with its fixed `fee`.
- A gift is rejected on an event order.
- A scheduled order's date is at or after `today + the longest lead_time_days` in the order, and the chosen period is deliverable under the fixed rule in ADR-021. There is no holiday check and no capacity check.

Preview creates nothing and reserves nothing.

## Inventory

On order creation, lock ready-product and box rows with `SELECT ... FOR UPDATE`, then decrement stock, and set `Order.inventory_held`. Made-to-order lines do not change stock. This includes shipping and event orders while they are still `pending`.

Release the same quantities once when the order is cancelled, then clear `inventory_held`. A second release is a no-op. Subscription deliveries do not decrement box stock in v1. Capacity stays a manual admin check.

## Payments

Server computes the amount. The client cannot submit an amount.

Payment is taken inside Checkout before the order is submitted (`spec §5`). Because `PaymentTransaction.order_id` is required, the order row is created first as `pending` / `unpaid` (ADR-020).

| Case | Create | After successful payment |
|---|---|---|
| Regular cash | `pending`, `unpaid`, stock held, no payment transaction | Admin confirms to `confirmed` |
| Regular electronic | `pending`, `unpaid`, stock held | `pending`, `paid`. Admin still confirms |
| Shipping or event | `pending`, `unpaid`, stock held | `pending`, `paid`. Admin confirms only when paid |
| Subscription | `pending_payment`, no stock change | `active`, generate delivery rows in the same transaction |

A failed attempt records a `failed` `PaymentTransaction` and leaves the order `pending` / `unpaid`. The customer may start another transaction. The order `payment_status` has no `failed` value.

The success webhook locks the order or subscription row. If the row is already cancelled, a late success does not reopen it. The transaction can be `succeeded` while the order stays `cancelled`. Staff record a manual refund.

There is no order payment deadline and no order-expiry job. Only subscriptions keep a payment deadline (`spec §5`; ADR-020).

Cash on delivery becomes `paid` only when an admin marks it paid through the existing `PATCH /admin/orders/{orderId}` route (`payment_status: paid`). The field is valid only for `cash_on_delivery` orders. The concept does not say this happens automatically at `delivered`.

## Cancellation and refunds

`can_cancel` and `cancel_deadline` are computed and are not stored.

- Regular or scheduled: the customer can cancel in `pending` or `confirmed`.
- Shipping or event: the customer can cancel in `pending` only.
- `preparing` and later statuses are admin-only.
- Rejection is allowed from `pending` only, requires a reason, and sets `cancelled` with `cancel_reason`. There is no `rejected` status.
- Refund rows are admin-recorded. The admin must enter both the amount and a non-empty reason. A refund has `order_id` or `subscription_id`, never both, and never neither.

Subscription cancellation: the customer creates a request. Admin approval sets the subscription to `cancelled`, cancels remaining `scheduled` deliveries, and requires the admin to enter the refund amount and a non-empty reason in the same action. Rejection leaves the subscription `active`. There is no automatic proration.

## Reviews

One review per `delivered` order (ADR-018). The customer submits `POST /orders/{orderId}/review` with a rating from 1 to 5 and an optional comment of at most 2000 characters. The review is published immediately. There is no moderation, edit, or delete route. Subscription deliveries are not reviewable because they are not orders.

## Subscription dates

Weekly: `start_date + 7 * n` days for `n = 0 .. deliveries_count - 1`.

Seasonal: `start_date` plus `n` times three calendar months. This is the approved reading of "one delivery per season". The user confirmed that a season and the concept's three-month step are the same idea, and that an admin can move a date so the schedule is not frozen to an exact day. `Season` is optional catalog grouping. It does not rebuild delivery dates.

When every delivery is `delivered` or `cancelled` and at least one is `delivered`, and none remain `scheduled` or `preparing`, the subscription becomes `completed`. If an admin cancels the subscription, it becomes `cancelled` even if some deliveries were delivered.

## Commission report

For a period, grandma product value is the sum of delivered order-item totals, excluding delivery and shipping fees. Platform share is that value times `commission_rate`. Grandma due is value minus platform share.

Each delivered subscription delivery adds `plan subtotal / deliveries_count` to the grandma value. Fees are excluded. The report does not pay anyone.

## Notifications

Stable `type` codes: `order_status_changed`, `payment_requested`, `order_rejected`, `subscription_delivery_upcoming`, `subscription_activated`, `subscription_ended`.

`order_rejected` describes the event of an admin rejecting a `pending` order; the stored order status is `cancelled` with a reason. The message text is Arabic and is stored at insert time (ADR-017). SMS in v1 is OTP only.
