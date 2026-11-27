# Orders and scheduling

## 1. Feature overview

Customers preview and create orders. Regular and scheduled orders are this feature. Shipping, events, and gifts add details documented beside it.

## 2. Scope

In: preview, create, list, detail, customer cancel, admin list and fulfillment for every order type. Shipping-specific fields are in the shipping feature. Event fields are in the events feature. Gift fields are in the gifts feature.

## 3. User roles

Customer for own orders. Admin with `orders` for all orders.

## 4. Permissions

`orders` for admin routes. Customer ownership otherwise.

## 5. Business rules

Follow BUSINESS_LOGIC and STATE_MACHINES. Reserve stock at creation. `can_cancel` is computed. Scheduled orders use the normal statuses plus `is_scheduled`, `delivery_date`, `delivery_period_id`, and `prepare_start_date`. Nearest slot is assigned when the order is not scheduled.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Preview, create, admin approve or reject, fulfillment steps, customer or admin cancel.

## 7. Related entities

Order, OrderItem, OrderStatusHistory, Product, Address, DeliveryPeriod.

## 8. Related endpoints

`POST /orders/preview`, `GET/POST /orders`, `GET /orders/{orderId}`, `POST /orders/{orderId}/cancel`, and the `/admin/orders` routes in the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

The preview and create bodies follow OpenAPI `CheckoutRequest` except the payment deltas. Quantity is a positive decimal. Date rules are in BUSINESS_LOGIC.

## 10. Security requirements

Customer queries constrain `customer_id`. Price and stock are server-side. Admin note fields are omitted from the customer payload.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Order creation target is p95 under 800 ms excluding the gateway. Lock products in id order. The gateway is not called inside this transaction.

## 12. Background jobs

`expire-order` for electronic `awaiting_payment` orders, plus the sweep.

## 13. Edge cases

Cash orders have no payment deadline. Repeating POST can create two orders. That limitation is accepted until an idempotency ADR. Last unit sold concurrently fails one request.

## 14. Failure scenarios

`PRICE_CHANGED` and `OUT_OF_STOCK` leave no order row. Expiry releases stock once.

## 15. Acceptance criteria

State transitions match STATE_MACHINES. Stock returns to the previous value after rejection, cancellation, and expiry.

## 16. Testing requirements

Integration: reservation, release, illegal transition, customer isolation, concurrent last unit. E2E: cash regular order to confirmed.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No production-capacity calendar. Staff move scheduled orders to preparing manually.
