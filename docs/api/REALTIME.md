# Realtime order-status monitoring

Socket.IO supplements the REST API for order-status monitoring. REST remains the source of truth for all reads and writes; this channel does not add an HTTP path or change `swagger.yaml`.

## Connection and authorization

- Namespace: `/orders`.
- A client supplies the existing access token in the Socket.IO handshake authentication payload. The gateway verifies it before accepting a subscription.
- The client sends `order.subscribe` with `{ "order_id": "<integer id>" }`.
- A customer may subscribe only to an order they own. An admin receives the same scoped authorization as the HTTP order-detail route: `orders.view`. Unauthorized and missing orders are not distinguishable.
- The gateway accepts no command that creates, changes, pays for, or cancels an order.

## Server event

After an order status change and its `OrderStatusHistory` row commit, the server emits `order.status.updated` to that order's room:

```json
{
  "order_id": "123",
  "status": "confirmed",
  "payment_status": "paid",
  "changed_at": "2026-11-28T12:00:00.000Z"
}
```

The event contains no address, phone, payment secret, customer note, or admin-only note. It is best-effort and is not an audit log. On connection or reconnection, the client fetches the order through REST, then subscribes again.

## Operations

The initial deployment is one application instance and uses no Socket.IO Redis adapter. If the application scales horizontally, add Socket.IO's Redis adapter and load-balancer sticky sessions in the same approved deployment change. Configure Socket.IO CORS from the existing `CORS_ORIGIN` allowlist.
