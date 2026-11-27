# In-app notifications

## 1. Feature overview

Customers see account notifications and can mark one as read.

## 2. Scope

In: list and mark read. Out: SMS and WhatsApp, except OTP which is not a notification row.

## 3. User roles

Customer for own rows. Creation is internal.

## 4. Permissions

Ownership. 404 for another user id.

## 5. Business rules

Types are the stable codes in BUSINESS_LOGIC. Message text is localized at insert time. Status is `unread` or `read`.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Order, payment, and subscription services insert a row in the same transaction as the state change. The reminder job inserts the upcoming-delivery row.

## 7. Related entities

Notification, Order, Subscription.

## 8. Related endpoints

`GET /me/notifications`, `PATCH /me/notifications/{notificationId}`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Patch only accepts a transition to read.

## 10. Security requirements

No admin broadcast endpoint exists. Do not add one.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Index `(user_id, status, created_at DESC)`. Paginate with `page` and `limit`.

## 12. Background jobs

`delivery-reminder` and `reminder-sweep`. Other notifications are synchronous inserts.

## 13. Edge cases

A reminder for a delivery that is no longer scheduled does not insert a row.

## 14. Failure scenarios

If the reminder job fails, the sweep retries scheduling. The state change that already committed is not rolled back.

## 15. Acceptance criteria

A payment-timeout cancellation creates `order_cancelled_payment_timeout`. Marking read is idempotent.

## 16. Testing requirements

Integration: status change and notification commit together. Job does not notify a cancelled delivery.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Background jobs use the default locale until a user preference exists.
