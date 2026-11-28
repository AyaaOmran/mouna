# Data flow

## Registration

1. `POST /auth/register` validates the body, writes an `OtpChallenge` with the phone, name, password hash, purpose `register`, and a hashed OTP. It does not write `User`.
2. A job sends the SMS. The HTTP response does not include the code.
3. `POST /auth/register/verify-otp` checks the hash, expiry, and attempt count, then creates the customer and consumes the challenge in one transaction.

Password reset and phone change use the same challenge entity with purposes `password_reset` and `phone_change`. Phone change stores the new phone on the challenge and updates `User.phone` only after success.

## Regular electronic checkout

Payment is taken inside Checkout, before the order is submitted (`spec §5`). The technical sequence keeps the order row because `PaymentTransaction.order_id` is required (ADR-020).

1. Preview re-prices the cart and reserves nothing.
2. `POST /orders` locks stock, inserts the order as `pending` / `unpaid`, and writes items, gift or schedule fields, and history.
3. `POST /payments` with `order_id` inserts a `pending` transaction and returns the gateway action from the configured adapter.
4. The webhook verifies the signature, locks the order, and sets `payment_status = paid`. A failed attempt records a `failed` transaction and leaves the order `pending` / `unpaid`; the customer may retry.
5. An admin with `orders.view` confirms or rejects. Rejection is allowed from `pending` only and sets `cancelled` with `cancel_reason`, releasing stock. A paid order that is cancelled needs a manual refund record. Each committed order-status change emits the Socket.IO order-status event.

There is no `awaiting_payment` step and no order payment deadline.

## Shipping and events

Create `pending` / `unpaid` and hold stock. The customer pays immediately through `POST /payments`, because shipping and event orders are electronic-only (`spec §9.2`, `§38.2`, `§38.3`). Success sets `paid` and the order stays `pending`. An admin with `orders.accept_reject` moves it to `confirmed` only when `payment_status = paid`. There is no payment deadline and no expiry. Fulfillment uses `out_for_delivery`; for shipping that is the hand-over to the carrier, where the company name and tracking number are entered.

## Subscription

Create `pending_payment` and a deadline. Payment success sets `active`, snapshots totals, and inserts all delivery rows in that transaction. Enqueue one reminder job per delivery for 24 hours before `delivery_date`. Completion is evaluated when a delivery is marked `delivered`. Only subscriptions keep `expire-subscription`.

## Read path

Catalog queries filter active records, paginate with `page` and `limit`, apply a whitelisted sort with an `id` tie-breaker, and eager-load only the relations the response DTO needs. Grandma and product ratings are aggregates, not stored columns.

## Message path

Arabic is the only product language (ADR-017). Services throw stable error codes. The exception filter resolves the Arabic message from the single catalog. Catalog fields have no `*_en` counterpart; the JSON field stays `name`. Field names, enums, and status codes stay English technical names.
