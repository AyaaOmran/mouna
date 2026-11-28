# Shipping orders

## 1. Feature overview

International shipping orders use the order machine with shipping details, a fixed country fee, and electronic payment before admin confirmation.

## 2. Scope

In: shipping detail fields and shipment tracking. Out: per-country product eligibility, weight-based fees, carrier API integration, and shipping-company account management.

## 3. User roles

Customer creates and pays. Admin with `orders.accept_reject` confirms or rejects. Admin with `orders.manage_payment_shipping` records the company name, tracking number, and payment status.

## 4. Permissions

`orders.view`, `orders.accept_reject`, and `orders.manage_payment_shipping`. Country and fee data is seeded; there is no `delivery` key.

## 5. Business rules

Items must have `channel_shipping`. Cooked food cannot. The fee is the active country's fixed fee, snapshotted on the order. Gift is allowed. Payment is electronic and must succeed before confirmation. The path is `pending` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`. `out_for_delivery` is the hand-over to the carrier; the admin enters the company name and tracking number as free text.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create `pending` / `unpaid`. The customer pays through `POST /payments`. Admin confirms only when `paid`, or rejects from `pending`. Staff move the order through fulfillment and record the company and tracking number at `out_for_delivery`.

## 7. Related entities

Order, OrderShippingDetail, ShippingCountry.

## 8. Related endpoints

Order routes plus `PUT /admin/orders/{orderId}/shipping`. Public `GET /shipping-countries`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Recipient name, phone, city, and address required. Preferred send date required. Country active. Tracking number is free text.

## 10. Security requirements

Shipping-detail updates require `orders.manage_payment_shipping`. Customers see tracking on their own order only.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Same as orders. No extra lock.

## 12. Background jobs

None. Shipping orders have no payment deadline and no expiry job.

## 13. Edge cases

Rejecting from `pending` releases stock and creates no refund. An unpaid order cannot be confirmed.

## 14. Failure scenarios

An unsupported country is 422. Payment after cancellation is a no-op success that does not reopen the order; staff record a manual refund.

## 15. Acceptance criteria

A shipping order cannot move to `confirmed` while `unpaid`. It cannot use `shipped` or `in_transit`. `shipping_company_name` is stored without a company table.

## 16. Testing requirements

Integration: paid guard on confirmation, state path, fee snapshot, free-text company, rejection release.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

One fee per country. No carrier API. No shipping-company accounts.
