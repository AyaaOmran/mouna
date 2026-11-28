# Data flow

## Registration

1. `POST /auth/register` validates the body, writes an `OtpChallenge` with the phone, name, password hash, purpose `register`, and a hashed OTP. It does not write `User`.
2. A job sends the SMS. The HTTP response does not include the code.
3. `POST /auth/register/verify-otp` checks the hash, expiry, and attempt count, then creates the customer and consumes the challenge in one transaction.

Password reset and phone change use the same challenge entity with purposes `password_reset` and `phone_change`. Phone change stores the new phone on the challenge and updates `User.phone` only after success.

## Regular electronic checkout

1. Preview re-prices the cart and reserves nothing.
2. `POST /orders` locks stock, inserts the order as `awaiting_payment`, and writes items, gift or schedule fields, and history.
3. `POST /payments` with `order_id` inserts a `pending` transaction and returns the gateway action from the configured adapter.
4. The webhook verifies the signature, locks the order, and either moves it to `pending` / `paid` or records failure.
5. An admin with `orders` confirms or rejects. Rejection releases stock and, if the payment succeeded, staff record a refund. Each committed order-status change emits the Socket.IO order-status event.

## Shipping and events

Create `pending` and hold stock. Admin approval moves the order to `awaiting_payment` and sets `payment_deadline`. The customer pays through `POST /payments`. Success moves the order to `confirmed` / `paid`. Expiry cancels and releases stock.

## Subscription

Create `pending_payment` and a deadline. Payment success sets `active`, snapshots totals, and inserts all delivery rows in that transaction. Enqueue one reminder job per delivery for 24 hours before `delivery_date`. Completion is evaluated when a delivery is marked `delivered`.

## Read path

Catalog queries filter active records, paginate with `page` and `limit`, and eager-load only the relations the response DTO needs. Grandma and product ratings are aggregates, not stored columns.

## Localization path

The interceptor reads `Accept-Language`. Services throw error codes. The exception filter resolves the message. Catalog services pick `name` or `name_en` while the JSON field stays `name`.
