# Event orders

## 1. Feature overview

Event orders use event products, event details, and the local delivery status path, with electronic payment before admin confirmation.

## 2. Scope

In: event detail and the filtered admin view. Out: custom quotes.

## 3. User roles

Customer creates and pays. Admin with an `orders.*` key mutates.

## 4. Permissions

`orders.view` for the list and detail (the event view is a filter, not a separate section). `orders.accept_reject` for approve and reject; `orders.update_status` for fulfillment.

## 5. Business rules

Items must have `channel_event`. Gift is rejected. The date respects the longest lead time. The zone fee is included. No quote step. Payment is electronic and must succeed before confirmation. The path is `pending` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create `pending` / `unpaid`. The customer pays through `POST /payments`. Admin confirms only when `paid`, or rejects from `pending`. Fulfillment follows the local path.

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

None. Event orders have no payment deadline and no expiry job.

## 13. Edge cases

A product that is both regular and event still cannot be gifted when the order type is event.

## 14. Failure scenarios

Illegal gift returns 422 and creates no order. An unpaid event order cannot be confirmed.

## 15. Acceptance criteria

Confirmation requires `payment_status = paid`. Approval never moves an order to `awaiting_payment`.

## 16. Testing requirements

Integration: gift rejected, unpaid confirmation rejected, paid confirmation, fee included in `fee_amount`.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Guest count does not change the price. Price comes from the products.
