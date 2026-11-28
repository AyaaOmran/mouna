# Requirements

Sources: the Arabic v2 spec, ERD v2, the endpoint list, OpenAPI, and the approved ADRs. This file is the English scope list. It does not replace the spec.

## Users

- Guests browse. Customers register with a mandatory phone OTP, then order and subscribe.
- Admins work only inside the function permissions granted to them. Super Admin manages admins, permissions, and the activity log, and bypasses every key.
- Grandmas have no accounts in v1. Staff notify them outside the system.

## Catalog

- One store. Each product belongs to one grandma and one category.
- Categories include cooked food, pantry goods, and boxes. Seasons optionally group products, boxes, and plans.
- A product has one price and one sale unit. A different price or unit is a different product. Ratings are integers from 1 to 5. There is no variant entity.
- Sale channels are regular, shipping, and events. Shipping is allowed for pantry goods and boxes only. `channel_shipping` is the single eligibility field, and a shippable product ships to every supported country.
- Boxes are products with their own stock and contents. Box stock is not deducted from the contents.
- Public voice playback uses `VoiceMessage.uuid`.
- Grandma `avg_rating` is the average of her delivered orders' ratings. Product `rating_avg` is the average of delivered orders containing the product.

## Orders

- The cart lives in frontend LocalStorage. The backend exposes preview and create, not a cart API.
- One active cart holds one order type and one grandma.
- Order type is `regular`, `shipping`, or `event`. `is_scheduled` and `is_gift` are separate flags.
- A made-to-order item forces scheduling. A ready item may allow scheduling. Scheduling needs a delivery date and period at or after today plus the longest lead time, deliverable under ADR-021.
- A regular order with no scheduling gets the nearest deliverable date and its first qualifying period.
- Shipping and event orders are electronic-only. They are created `pending` / `unpaid` and must be `paid` before an admin confirms them.
- Gifts are allowed on regular, scheduled, and shipping orders. Gifts are not allowed on events or subscriptions. The recipient package has no price invoice.
- The customer may cancel a regular or scheduled order in `pending` or `confirmed`, before preparation starts. The customer may cancel a shipping or event order in `pending` only. Later cancellation is admin-only.
- Rejection is from `pending` only and sets `cancelled` with a reason. There is no `rejected` status.
- Electronic refunds are recorded by an admin. They are not sent to the gateway automatically in v1.

## Payments

- Currency is SYP. Money is `numeric(10,2)`.
- Payment is taken inside Checkout before the order is submitted. The order row is created `pending` / `unpaid` because `PaymentTransaction.order_id` is required (ADR-020).
- Regular cash on delivery stays `pending` / `unpaid` until an admin confirms and later records cash collection.
- Regular electronic payment success sets `paid` and leaves the order `pending` for admin confirmation.
- Shipping and event payment success sets `paid`; confirmation requires it.
- Only subscriptions have a payment deadline. Expiry cancels the subscription. Orders have no deadline and no expiry job.
- A failed attempt is recorded on `PaymentTransaction`; the order `payment_status` is `unpaid`, `paid`, or `refunded` only.
- A payment transaction points at exactly one order or exactly one subscription.
- A refund points at exactly one order or exactly one subscription.
- Webhooks are idempotent on `gateway_reference`. Confirmation locks the same row.

## Subscriptions

- Weekly or seasonal. One grandma and one box per plan. Payment is electronic and in full before activation.
- Weekly dates are the start date plus 7 days, repeated. Seasonal dates are the start date plus three calendar months, repeated, which is the approved meaning of one delivery per season. An admin may change a delivery date. Season rows do not regenerate those dates.
- Deliveries are not orders. Statuses are `scheduled`, `preparing`, `delivered`, `cancelled`.
- An approved cancellation cancels the subscription and remaining scheduled deliveries. The admin enters the refund amount.
- An upcoming-delivery notification is created 24 hours before the delivery date.

## Reviews

- One review per `delivered` order, 1–5 stars with an optional comment of at most 2000 characters.
- `POST /orders/{orderId}/review`; the review is published immediately. No moderation, edit, or delete.
- Subscription deliveries are not reviewable.

## Localization

- Arabic is the only product language. The website and dashboard are Arabic and RTL, with no language switcher.
- API messages are Arabic. Catalog text has no English column.
- Notification text is stored in Arabic at creation time, with a stable type code.
- Field names, enums, status codes, error codes, permission keys, database columns, code, comments, and documentation stay English. That is not bilingual support.

## Explicit non-goals

Spec §30 and §37, plus no microservices, no Kafka, no gRPC, no CMS, no coupons, no grandma payout execution, no holiday calendar, no complex delivery schedules or exceptions, no driver role or GPS, no carrier API integration, no per-product-per-country eligibility, no event quotes, no review moderation screen, and no independent system, payment, or commission settings pages. Socket.IO is the narrow exception for authenticated order-status monitoring only; it adds no state-changing API.
