# Event orders

## 1. Feature overview

Event orders use event products, event details, and the local delivery status path, with payment after approval.

## 2. Scope

In: event detail and the filtered admin view. Out: custom quotes.

## 3. User roles

Customer creates. Admin with `orders` mutates. Admin with `events` can read the filtered view.

## 4. Permissions

`events` for the read view. `orders` for approve, reject, and status.

## 5. Business rules

Items must have `channel_event`. Gift is rejected. Date respects the longest lead time. Zone fee is included. No quote step.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create `pending`. Admin approves or rejects. Customer pays. Fulfillment follows the local path.

## 7. Related entities

OrderEventDetail, DeliveryZone, Order.

## 8. Related endpoints

Order routes. The filtered view is `GET /admin/orders` with the type filter already in the contract, not a new path.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Event type, date, time, guest count, zone, address, and contact phone are required. Event type values are the OpenAPI enum. Do not extend that enum.

## 10. Security requirements

Same ownership rules as orders.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Same as orders.

## 12. Background jobs

Order expiry after the order is `awaiting_payment`.

## 13. Edge cases

A product that is both regular and event still cannot be gifted when the order type is event.

## 14. Failure scenarios

Illegal gift returns 422 and creates no order.

## 15. Acceptance criteria

Approval moves to `awaiting_payment`, not `confirmed`.

## 16. Testing requirements

Integration: gift rejected, approval status, fee included in `fee_amount`.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Guest count does not change the price. Price comes from the products.
