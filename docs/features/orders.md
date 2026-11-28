# Orders and scheduling

## 1. Feature overview

Customers preview and create orders. Regular and scheduled orders are this feature. Shipping, events, and gifts add details documented beside it.

## 2. Scope

In: preview, create, list, detail, customer cancel, admin list and fulfillment for every order type, plus authenticated Socket.IO order-status monitoring. Shipping-specific fields are in the shipping feature. Event fields are in the events feature. Gift fields are in the gifts feature.

## 3. User roles

Customer for own orders. Admin with an `orders.*` key for admin routes.

## 4. Permissions

`orders.view` for reads; `orders.accept_reject`, `orders.update_status`, `orders.cancel`, and `orders.manage_payment_shipping` for the matching mutations. Customer ownership otherwise. See [USER_ROLES_AND_PERMISSIONS.md](../product/USER_ROLES_AND_PERMISSIONS.md).

## 5. Business rules

Follow BUSINESS_LOGIC and STATE_MACHINES. The status set is `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled`. Reserve stock at creation. `can_cancel` is computed. Scheduled orders use the normal statuses plus `is_scheduled`, `delivery_date`, `delivery_period_id`, and `prepare_start_date`. A non-scheduled order gets the nearest deliverable date and its first qualifying period under ADR-021. There is no `awaiting_payment` status and no order payment deadline.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Preview, create, pay (electronic), admin approve or reject, fulfillment steps, customer or admin cancel. A client may subscribe to its authorized order room and receives a post-commit status update; it re-fetches REST state after reconnecting.

## 7. Related entities

Order, OrderItem, OrderStatusHistory, Product, Address, DeliveryPeriod, DeliveryZone.

## 8. Related endpoints

`POST /orders/preview`, `GET/POST /orders`, `GET /orders/{orderId}`, `POST /orders/{orderId}/cancel`, and the `/admin/orders` routes in the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

The preview and create bodies follow OpenAPI `CheckoutRequest`. Quantity is a positive decimal. Date rules are in BUSINESS_LOGIC and ADR-021.

## 10. Security requirements

Customer queries constrain `customer_id`. Price and stock are server-side. Admin note fields are omitted from the customer payload. Socket.IO handshake and room subscription enforce the same customer ownership or `orders.view` authorization; the socket accepts no order-changing command.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Order creation target is p95 under 800 ms excluding the gateway. Lock products in id order. The gateway is not called inside this transaction. List queries use `page`/`limit` and a stable sort ending with `id`.

## 12. Background jobs

None for orders. A committed status update emits the documented Socket.IO event after commit; it is not a background job. Subscription expiry is owned by the subscriptions feature.

## 13. Edge cases

Cash orders stay `unpaid` until an admin records collection. Repeating POST can create two orders. That limitation is accepted until an idempotency ADR. Last unit sold concurrently fails one request.

## 14. Failure scenarios

`PRICE_CHANGED` and `OUT_OF_STOCK` leave no order row. Cancellation releases stock once. A failed electronic attempt leaves the order `pending` / `unpaid` and does not create a second order.

## 15. Acceptance criteria

State transitions match STATE_MACHINES. Stock returns to the previous value after cancellation. No endpoint or schema exposes `awaiting_payment`, `shipped`, `in_transit`, or `rejected`.

## 16. Testing requirements

Integration: reservation, release, illegal transition, customer isolation, concurrent last unit, and post-commit Socket.IO emission. E2E: cash regular order to confirmed, electronic order to paid and confirmed, authenticated subscription, and unauthorized room denial.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No production-capacity calendar. Staff move scheduled orders to preparing manually. No idempotency key on order creation.
