# Modules

Each module owns its tables and its admin and customer controllers. A separate "admin" module would duplicate those services.

| Module | Owns | Talks to |
|---|---|---|
| `IdentityModule` | User, Permission, UserPermission, RefreshToken, OtpChallenge, Address, ActivityLog | Delivery zones for address validation, Notifications, OTP queue |
| `CatalogModule` | Category, Season, Product, ProductImage, Box, BoxItem | Grandmas |
| `GrandmasModule` | Grandma, Recipe, VoiceMessage | Catalog for public product lists by grandma |
| `DeliveryModule` | DeliveryZone, DeliveryPeriod, DeliverySlot, Holiday, DeliverySetting, ShippingCountry, ShippingCompany | none |
| `OrdersModule` | Order, OrderItem, shipping, event, and gift details, OrderStatusHistory; `OrdersGateway` | Catalog stock, Delivery, Payments, Notifications |
| `PaymentsModule` | PaymentMethod, PaymentTransaction, Refund | Orders, Subscriptions, gateway interface |
| `SubscriptionsModule` | Plan, Subscription, Delivery, CancellationRequest | Catalog, Delivery, Payments, Notifications |
| `NotificationsModule` | Notification | queue for reminders |
| `ReviewsModule` | Review | Orders |
| `ReportsModule` | no tables | read-only queries on orders and subscriptions |
| `JobsModule` | BullMQ registration | processors stay in the owning module |
| `StorageModule` | no tables | file storage interface |

`AppModule` imports configuration, TypeORM, the throttler, BullMQ, and the feature modules.

## Dependency direction

`Identity`, `Catalog`, `Grandmas`, and `Delivery` do not import `Orders`. `Orders` and `Subscriptions` may import catalog and delivery services. `Payments` receives order and subscription services through narrow methods (`markPaid`, `expire`) so payments do not become the owner of order rules. If that import cycle appears, move the status transition into the owning service and call it from the payment webhook handler.

## Controllers

Public and admin controllers live beside the feature. Routes and Swagger decorators match [swagger.yaml](../api/swagger.yaml).

## Background processors

| Processor | Module |
|---|---|
| OTP sender | Identity |
| Order expiry | Orders |
| Subscription expiry | Subscriptions |
| Delivery reminder | Notifications |

`OrdersGateway` is a Socket.IO provider in `OrdersModule`. It publishes committed order-status changes only; it does not own a table or order rules. See [REALTIME.md](../api/REALTIME.md).

The processor calls the feature service. It does not embed a second copy of the status rules.
