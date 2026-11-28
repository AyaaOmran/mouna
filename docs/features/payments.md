# Payments and refunds

## 1. Feature overview

Electronic payments and admin-recorded refunds. The gateway vendor is an interface. Payment is taken inside Checkout before the order is submitted; the order row exists first because `PaymentTransaction.order_id` is required (ADR-020).

## 2. Scope

In: start payment, poll status, webhook, admin refunds. Out: automatic gateway refunds and a chosen vendor.

## 3. User roles

Customer starts and reads own payments. Admin with `orders.manage_payment_shipping` or `subscriptions.update_delivery_status` records the matching refund. The gateway calls the webhook.

## 4. Permissions

Order refunds require `orders.manage_payment_shipping`. Subscription refunds require `subscriptions.update_delivery_status`. The webhook is public and authenticated by the adapter signature.

## 5. Business rules

Amount is computed by the server. Exactly one parent. Idempotent webhook. Cash is not a `PaymentTransaction`. An admin sets cash `payment_status` to `paid`. Refund amount is admin-entered and cannot exceed the captured total.

A successful payment sets `payment_status = paid` and leaves the order `pending`. A failed attempt records `failed` and leaves the order `pending` / `unpaid`. The order `payment_status` has no `failed` value.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create a pending transaction after the order or subscription row exists. The adapter returns `gateway_action`. The webhook updates the transaction and the parent. A retry creates a new transaction.

## 7. Related entities

PaymentMethod, PaymentTransaction, Refund, Order, Subscription.

## 8. Related endpoints

`POST /payments`, `GET /payments/{paymentId}`, `POST /payments/webhook`, `POST /admin/orders/{orderId}/refunds`, `POST /admin/subscriptions/{subscriptionId}/refunds`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Payment method must be an active electronic method. Refund reason required. Amount positive and at most the paid total minus previous refunds.

## 10. Security requirements

Verify webhook signatures before writes. Customers can read only transactions whose parent they own. No card data is stored.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Webhook work is a short transaction. Do not call the gateway again while holding the row lock.

## 12. Background jobs

Only `expire-subscription` remains. Orders have no expiry job. The webhook is not queued.

## 13. Edge cases

A second pending transaction is allowed after `failed`. Two `succeeded` transactions for one parent are a 409. Late success after cancel does not change the parent status.

## 14. Failure scenarios

An unconfigured provider fails closed with 503 and a stable code `PAYMENT_PROVIDER_UNAVAILABLE`. An unsigned webhook returns 401.

## 15. Acceptance criteria

A successful payment never has a null parent. Replay does not double-apply. Refund XOR is enforced by the database. No order ever enters `awaiting_payment`.

## 16. Testing requirements

Integration: idempotent webhook, retry after failure, race with cancellation, refund check constraint, ownership. Use a fake gateway adapter.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No live gateway. `gateway_action` shape is test-only until a vendor ADR. Refunds are not executed at the gateway.
