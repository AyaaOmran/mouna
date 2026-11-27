# Shipping orders

## 1. Feature overview

International shipping orders use the order machine with shipping details, a preset country fee, and payment after admin approval.

## 2. Scope

In: shipping detail fields and shipment tracking. Out: per-country product eligibility and weight-based fees.

## 3. User roles

Customer creates. Admin with `orders` approves and records tracking. Admin with `delivery` manages countries and companies.

## 4. Permissions

`orders` for the order. `delivery` for country settings.

## 5. Business rules

Items must have `channel_shipping`. Cooked food cannot. Fee is the active country fee. Gift is allowed. Payment is electronic after approval. Path uses `shipped` and `in_transit`, not local delivery statuses.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create `pending`. Admin approves to `awaiting_payment` or rejects. Customer pays. Staff record company and tracking.

## 7. Related entities

OrderShippingDetail, ShippingCountry, ShippingCompany, Order.

## 8. Related endpoints

Order routes plus `PUT /admin/orders/{orderId}/shipment`. Country routes are the delivery-settings feature.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Recipient name, phone, city, and address required. Preferred send date required. Country active.

## 10. Security requirements

Tracking updates require `orders`. Customers see tracking on their order only.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Same as orders. No extra lock.

## 12. Background jobs

Order expiry after approval sets the deadline.

## 13. Edge cases

Rejecting before payment releases stock and creates no refund. Rejecting is only from `pending`.

## 14. Failure scenarios

Unsupported country is 422. Payment after cancellation is `PAYMENT_WINDOW_CLOSED` or a no-op success that does not reopen the order.

## 15. Acceptance criteria

A shipping order cannot enter `out_for_delivery`.

## 16. Testing requirements

Integration: state path and fee snapshot on the order.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

One fee per country. No carrier API.
