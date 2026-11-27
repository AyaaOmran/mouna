# Business logic

Normative behavior for implementation. Concept section numbers point at the preserved Arabic file. ADR overrides are marked.

## Identity

Registration collects first name, last name, phone, password, and confirmation, plus terms acceptance. The account is created only after the OTP succeeds. Login is phone and password. Password reset and phone change require OTP. Logout revokes the refresh token.

Access tokens last 15 minutes. Refresh tokens are opaque, stored only as a hash, last 30 days, rotate on refresh, and are revoked on logout. OTP is 6 digits, expires in 5 minutes, and allows 5 attempts. Passwords use Argon2id. The cost parameters are an open item in [OPEN_QUESTIONS.md](../planning/OPEN_QUESTIONS.md). Empty passwords are rejected. Password and confirmation must match. A stronger length rule is not defined.

Phone uniqueness is required. A canonical phone format is not defined. Store the verified string and do not guess a country code.

Disabled users cannot authenticate.

## Catalog rules

- Public lists return `active` products and `active` grandmas only. Draft and hidden products, and pending or unavailable grandmas, are admin-only.
- Availability shown to customers is computed: in stock, made to order, or unavailable. It is not a stored status.
- Grandma rating is the average of published product reviews. Customers do not rate a grandma directly.
- Season status is computed from start and end dates: upcoming, active, ended.
- Made to order requires `lead_time_days > 0` and `allow_scheduling = true`.
- `channel_shipping` cannot be set when the category is cooked food.
- A box can be marked shippable only when every content item is shippable.
- Exactly one grandma can be grandma of the month.
- Home banners and static pages are not database content.

## Checkout validation

`POST /orders/preview` and `POST /orders` both re-check:

- Products are active. Ready items and boxes have enough stock. Made-to-order items need no stock quantity.
- Prices match the current catalog. A mismatch returns 409 with a fresh preview. The order is created only after the client accepts the new total.
- All items match the requested channel and the same grandma. That grandma is active.
- Local orders use an active delivery zone. Shipping orders use an active country and a preset fee. Event dates respect the longest lead time.
- A gift is rejected on an event order.
- A scheduled order's date is after today plus the longest lead time, on an open delivery slot, and not on a holiday.

Preview creates nothing and reserves nothing.

## Inventory

On order creation, lock ready-product and box rows with `SELECT ... FOR UPDATE`, then decrement stock, and set `Order.inventory_held`. Made-to-order lines do not change stock. This includes shipping and event orders while they are still `pending`.

Release the same quantities once when the order is rejected, cancelled, or expired, then clear `inventory_held`. A second release is a no-op. Subscription deliveries do not decrement box stock in v1. Capacity stays a manual admin check, as in the concept.

## Payments

Server computes the amount. The client cannot submit an amount.

| Case | Create | After successful payment |
|---|---|---|
| Regular cash | `pending`, `unpaid`, stock held, no payment transaction | Admin confirms to `confirmed` |
| Regular electronic | `awaiting_payment`, `unpaid`, stock held, deadline set | `pending`, `paid`. Admin still confirms |
| Shipping or event | `pending`, `unpaid`, stock held | After admin moves it to `awaiting_payment` and payment succeeds: `confirmed`, `paid` |
| Subscription | `pending_payment`, no stock change | `active`, generate delivery rows in the same transaction |

A failed attempt leaves a regular electronic order in `awaiting_payment` with `payment_status = failed` so the customer can start another transaction until the deadline.

Expiry and the success webhook lock the order or subscription row. If the row is already cancelled, a late success does not reopen it. The transaction can be `succeeded` while the order stays `cancelled`. Staff record a manual refund.

Cash on delivery becomes `paid` only when an admin marks it paid. The concept does not say this happens automatically at `delivered`.

## Cancellation and refunds

`can_cancel` and `cancel_deadline` are computed and are not stored.

- Regular or scheduled: the customer can cancel in `pending` or `confirmed`.
- Shipping or event: the customer can cancel in `pending` or `awaiting_payment`.
- `preparing` and later statuses are admin-only.
- Rejection is allowed from `pending` only, and requires a reason.
- Payment-timeout cancellation is done by the expiry job, with the reason stored as the Arabic concept phrase for payment timeout, localized for the customer message.
- Refund rows are admin-recorded. Amount is entered by the admin. A refund has `order_id` or `subscription_id`, never both, and never neither.

Subscription cancellation: the customer creates a request. Admin approval sets the subscription to `cancelled`, cancels remaining `scheduled` deliveries, and requires the admin to enter a refund amount in the same action. Rejection leaves the subscription `active`. There is no automatic proration.

## Subscription dates

Weekly: `start_date + 7 * n` days for `n = 0 .. deliveries_count - 1`.

Seasonal: `start_date` plus `n` times three calendar months. This is the approved reading of "one delivery per season". The user confirmed that a season and the concept's three-month step are the same idea, and that an admin can move a date so the schedule is not frozen to an exact day. `Season` is optional catalog grouping. It does not rebuild delivery dates.

When every delivery is `delivered` or `cancelled` and at least one is `delivered`, and none remain `scheduled` or `preparing`, the subscription becomes `completed`. If an admin cancels the subscription, it becomes `cancelled` even if some deliveries were delivered.

## Commission report

For a period, grandma product value is the sum of delivered order-item totals, excluding delivery and shipping fees. Platform share is that value times `commission_rate`. Grandma due is value minus platform share.

Each delivered subscription delivery adds `plan subtotal / deliveries_count` to the grandma value. Fees are excluded. The report does not pay anyone.

## Notifications

Stable `type` codes: `order_status_changed`, `payment_requested`, `order_rejected`, `order_cancelled_payment_timeout`, `subscription_delivery_upcoming`, `subscription_activated`, `subscription_ended`.

The message text is localized at insert time. SMS in v1 is OTP only.
