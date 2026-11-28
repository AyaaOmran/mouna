# ADR-016: Socket.IO order-status monitoring

**Status:** Accepted, 28 November 2026.

Socket.IO is approved only to notify authenticated customers and authorized admins that an order state changed. It does not introduce a second order API, a command transport, persistent event stream, generic event bus, or a change to REST/OpenAPI ownership.

The `OrdersModule` owns one gateway on the `/orders` namespace. A client authenticates with the existing access token during the Socket.IO handshake and requests the documented order room. Customers may join only their own order; admin access follows the same scoped order-read authorization as HTTP. The gateway emits `order.status.updated` only after the transaction that writes `Order` and `OrderStatusHistory` commits. REST remains authoritative, so a client reconnects by fetching the current order and subscribing again.

The first deployment is a single application instance. It does not use a Socket.IO Redis adapter. A later multi-instance deployment must add the Redis adapter and load-balancer sticky-session configuration together; Redis alone is insufficient for Socket.IO polling connections. Socket CORS uses the existing application allowlist.

The protocol is in [REALTIME.md](../../api/REALTIME.md). The implementation packages are `@nestjs/websockets`, `@nestjs/platform-socket.io`, and `socket.io`, matching the Nest 12 line. Tests cover handshake authentication, ownership/permission-scoped subscription, post-commit emission, and REST recovery after reconnect.
