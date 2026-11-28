# Requirements traceability

This matrix links the product to the design. It does not show that any row is implemented.

| Requirement | Feature | Rules | Entities | Endpoints | Module | Criterion | Rule and skill | Tests |
|---|---|---|---|---|---|---|---|---|
| OTP registration and login | authentication | BUSINESS_LOGIC identity | User, OtpChallenge, RefreshToken | `/auth/*` | Identity | Security, jobs | security rule, nestjs-universe auth reference | OTP attempts, logout revocation |
| Profile and phone change | account | same | User, OtpChallenge | `/me` | Identity | API, security | api rule | Phone updates only after OTP |
| Addresses and history | addresses | ERD address rule, ADR-015 | Address | `/me/addresses` | Identity | Database | database rule | Soft-delete snapshot, five-active cap |
| In-app notices | notifications | notification types, ADR-017 | Notification | `/me/notifications` | Notifications | Jobs | jobs rule | Commit with status change |
| Browse | catalog | channel and visibility, ADR-018 | Product, Grandma, Season | public GETs | Catalog, Grandmas | API, performance | api, performance rules | Rating aggregate, filters, pagination |
| Grandma admin | grandmas | one grandma of the month | Grandma, Recipe, VoiceMessage | `/admin/grandmas` | Grandmas | Security | security rule | Function key and unique flag |
| Products and boxes | products-and-boxes | fulfillment and channels | Product, Box, BoxItem | `/admin/products` | Catalog | Database | database rule | Shipping ban, box stock |
| Categories and seasons | categories-and-seasons | computed season | Category, Season | `/admin/categories` | Catalog | API | api rule | Hidden category, `products.create_edit` |
| No server cart | cart | spec §5 | none | none | none | Architecture | architecture rule | Route absent |
| Checkout and stock | orders | ADR-004, ADR-020 | Order, OrderItem | `/orders` | Orders | Database, performance | database, performance | Lock and release, status set |
| Shipping | shipping | spec §9.2, ADR-020 | OrderShippingDetail | order shipping route | Orders | API | api rule | Paid guard, free-text company |
| Events | events | spec §8, ADR-020 | OrderEventDetail | order routes | Orders | API | api rule | No gift, paid guard |
| Gifts | gifts | spec §7 | OrderGiftDetail | order body | Orders | API | api rule | Recipient zone fee |
| Payments | payments | ADR-005, ADR-020 | PaymentTransaction, Refund | `/payments` | Payments | Security, jobs | security, jobs | Webhook idempotency, retry after failure |
| Reviews | reviews | ADR-018 | Review | `POST /orders/{orderId}/review` | Reviews | API | api rule | One per order |
| Subscriptions | subscriptions | ADR-006, ADR-007 | Subscription, SubscriptionDelivery | `/subscriptions` | Subscriptions | Jobs, database | jobs rule | Dates and refund |
| Delivery reference data | delivery-settings | spec §9, §22, §26, ADR-021 | DeliveryZone, DeliveryPeriod, ShippingCountry, DeliverySetting | public reference GETs | Delivery | API | api rule | Nearest-date rule |
| Dashboard | dashboard | spec §14, ADR-022 | read models | `/admin/dashboard` | Reports | API | api rule | Five cards, three keys |
| Dues | reports | spec §24 | order items, deliveries | `/admin/reports/*` | Reports | Database | database rule | Fixture math |
| Customer admin read | customers-admin | spec §21 | User | `/admin/customers` | Identity | Security | security rule | Secret redaction, function keys |
| Super Admin | super-admin | ADR-019, spec §26 | Permission, SystemSetting | `/super-admin/*` | Identity | Security | security rule | Function-key denial |
| Static content | static-pages | spec §3.10 | none | none | none | Architecture | architecture rule | No CMS route |
| Arabic only | all customer-facing | ADR-017 | none | all | common catalog | API | api rule, AGENTS.md | Arabic message, no `*_en` |

Acceptance criteria live in each feature file. Engineering criteria coverage is in [QUALITY_ASSESSMENT.md](QUALITY_ASSESSMENT.md).
