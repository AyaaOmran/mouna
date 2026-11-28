# Realtime and patterns

- Implement one `OrdersGateway` in `OrdersModule`, using Socket.IO only for the `/orders` namespace and the `order.status.updated` event in `docs/api/REALTIME.md`.
- Authenticate a Socket.IO handshake before a client subscribes. Authorize an order room with the same service-level ownership or scoped admin-read check as `GET /orders/{orderId}` or `GET /admin/orders/{orderId}`.
- The order service writes the status and history in its transaction, commits, then calls the gateway to emit. Socket events are best-effort; a reconnecting client re-fetches REST state.
- Keep one application instance without a Socket.IO Redis adapter. Add the Redis adapter and sticky-session support only when deployment scales to multiple instances.
- Use Strategy only for approved external ports, and choose its implementation in composition/configuration. Do not introduce manual singletons, a generic event bus, CQRS, or repositories over TypeORM repositories.
