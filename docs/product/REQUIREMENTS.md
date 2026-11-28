# Requirements

Sources: the Arabic concept, ERD v2, the endpoint list, OpenAPI 2.0.0, and the approved ADRs. This file is the English scope list. It does not replace the concept.

## Users

- Guests browse. Customers register with a mandatory phone OTP, then order and subscribe.
- Admins work only inside granted sections. Super Admin manages admins, permissions, system settings, payment settings, commission, and the activity log.
- Grandmas have no accounts in v1. Staff notify them outside the system.

## Catalog

- One store. Each product belongs to one grandma and one category.
- Categories include cooked food, pantry goods, and boxes. Seasons optionally group products, boxes, and plans.
- A product has one price and one sale unit. A different price or unit is a different product. Ratings are integers from 1 to 5. There is no variant entity.
- Sale channels are regular, shipping, and events. Shipping is allowed for pantry goods and boxes only, and a shippable product ships to every supported country.
- Boxes are products with their own stock and contents. Box stock is not deducted from the contents.
- Public voice playback uses `VoiceMessage.uuid`.

## Orders

- The cart lives in frontend LocalStorage. The backend exposes preview and create, not a cart API.
- One active cart holds one order type and one grandma.
- Order type is `regular`, `shipping`, or `event`. `is_scheduled` and `is_gift` are separate flags.
- A made-to-order item forces scheduling. A ready item may allow scheduling. Scheduling needs a delivery date and period after today plus the longest lead time.
- A regular order with no scheduling gets the nearest delivery slot.
- Shipping and event orders are created as `pending` for admin review. Electronic payment starts only after approval.
- Gifts are allowed on regular, scheduled, and shipping orders. Gifts are not allowed on events or subscriptions. The recipient package has no price invoice.
- The customer may cancel a regular or scheduled order in `pending` or `confirmed`, before preparation starts. The customer may cancel a shipping or event order in `pending` or `awaiting_payment`. Later cancellation is admin-only.
- Electronic refunds are recorded by an admin. They are not sent to the gateway automatically in v1.

## Payments

- Currency is SYP. Money is `numeric(10,2)`.
- Regular cash on delivery creates `pending` / `unpaid`.
- Regular electronic checkout creates `awaiting_payment` before the gateway call. Success moves the order to `pending` / `paid` for admin confirmation.
- Shipping, events, and subscriptions use the payment deadline from system settings. Expiry cancels the record and releases held stock for orders.
- A payment transaction points at exactly one order or exactly one subscription.
- A refund points at exactly one order or exactly one subscription.
- Webhooks are idempotent on `gateway_reference`. Confirmation and expiry lock the same row.

## Subscriptions

- Weekly or seasonal. One grandma and one box per plan. Payment is electronic and in full before activation.
- Weekly dates are the start date plus 7 days, repeated. Seasonal dates are the start date plus three calendar months, repeated, which is the approved meaning of one delivery per season. An admin may change a delivery date. Season rows do not regenerate those dates.
- Deliveries are not orders. Statuses are `scheduled`, `preparing`, `delivered`, `cancelled`.
- An approved cancellation cancels the subscription and remaining scheduled deliveries. The admin enters the refund amount.
- An upcoming-delivery notification is created 24 hours before the delivery date.

## Localization

- Default language is Arabic. `Accept-Language` selects `ar` or `en`. Anything else falls back to Arabic.
- API messages are localized. Catalog English text is stored in nullable `*_en` columns. Missing English falls back to the Arabic column.
- Notification text is stored in the language active when the notification was created, with a stable type code.

## Explicit non-goals

Concept section 17, plus no microservices, no Kafka, no gRPC, no CMS, no coupons, no grandma payout execution. Socket.IO is the narrow exception for authenticated order-status monitoring only; it adds no state-changing API.
