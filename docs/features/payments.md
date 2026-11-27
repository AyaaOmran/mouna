# Payments and refunds

## 1. Feature overview

Electronic payments and admin-recorded refunds. The gateway vendor is an interface.

## 2. Scope

In: start payment, poll status, webhook, admin refunds. Out: automatic gateway refunds and a chosen vendor.

## 3. User roles

Customer starts and reads own payments. Admin with `orders` or `subscriptions` records the matching refund. The gateway calls the webhook.

## 4. Permissions

Refunds require `orders` or `subscriptions` for the parent type. Webhook is public and authenticated by the adapter signature.

## 5. Business rules

Amount is computed by the server. Exactly one parent. Idempotent webhook. Race rules in BUSINESS_LOGIC. Cash is not a PaymentTransaction. An admin sets cash `payment_status` to `paid`. Refund amount is admin-entered and cannot exceed the captured total.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create a pending transaction after the order or subscription exists. Adapter returns `gateway_action`. Webhook updates the transaction and the parent.

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

Expiry jobs live with orders and subscriptions. The webhook is not queued.

## 13. Edge cases

A second pending transaction is allowed after `failed`. Two `succeeded` transactions for one parent are a 409. Late success after cancel does not change the parent status.

## 14. Failure scenarios

Unconfigured provider fails closed with 503 and a stable code `PAYMENT_PROVIDER_UNAVAILABLE`. Unsigned webhook returns 401.

## 15. Acceptance criteria

Successful payment never has a null parent. Replay does not double-apply. Refund XOR is enforced by the database.

## 16. Testing requirements

Integration: idempotent webhook, race with expiry, refund check constraint, ownership. Use a fake gateway adapter.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No live gateway. `gateway_action` shape is test-only until a vendor ADR. Refunds are not executed at the gateway.
