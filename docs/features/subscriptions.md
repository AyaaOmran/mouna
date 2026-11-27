# Subscriptions

## 1. Feature overview

Customers buy a weekly or seasonal plan. Activation creates delivery rows. Cancellation is an admin decision with a manual refund amount and reason.

## 2. Scope

In: plans, subscribe, list, cancel request, admin deliveries. Out: putting deliveries into the orders table, stock decrement.

## 3. User roles

Public reads active plans. Customer manages own subscriptions. Admin with `subscriptions` manages plans, requests, and deliveries.

## 4. Permissions

`subscriptions`.

## 5. Business rules

Payment in full before activation. Fee is zone fee times delivery count. Subtotal snapshots the plan price. Weekly dates add 7 days. Seasonal dates add three calendar months, meaning one delivery per season. Admins may edit a delivery date. Approval of cancellation cancels remaining scheduled deliveries and records the refund amount and reason entered by the admin. Completion follows STATE_MACHINES.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create `pending_payment`, pay, generate rows, remind, deliver, complete or cancel.

## 7. Related entities

SubscriptionPlan, Subscription, SubscriptionDelivery, SubscriptionCancellationRequest, Box, Address.

## 8. Related endpoints

Customer and admin subscription routes in the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Start date is not in the past. Address zone is active. Plan is available. Deliveries count is a positive integer.

## 10. Security requirements

Customer isolation. Plan price on the client is ignored.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Insert all delivery rows in the activation transaction. The count is a plan field, not an unbounded loop from the client.

## 12. Background jobs

Expire unpaid subscriptions. Reminder 24 hours before each delivery.

## 13. Edge cases

A seasonal plan may also point at a Season for catalog grouping. That link does not rebuild dates. Holidays do not move generated dates.

## 14. Failure scenarios

Payment after expiry does not activate. Missing SMS is irrelevant. Missing payment provider fails closed.

## 15. Acceptance criteria

Delivery count matches the plan. Customer cancel does not itself cancel the subscription. Admin approval does.

## 16. Testing requirements

Integration: date generation for both plan types, activation transaction, cancellation refund row, reminder skip.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No automatic proration. No stock reservation. No gift.
