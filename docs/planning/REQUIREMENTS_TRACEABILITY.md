# Requirements traceability

This matrix links the product to the design. It does not show that any row is implemented.

| Requirement | Feature | Rules | Entities | Endpoints | Module | Criterion | Rule and skill | Tests |
|---|---|---|---|---|---|---|---|---|
| OTP registration and login | authentication | BUSINESS_LOGIC identity | User, OtpChallenge, RefreshToken | `/auth/*` | Identity | Security, jobs | security rule, nestjs-universe auth reference | OTP attempts, logout revocation |
| Profile and phone change | account | same | User, OtpChallenge | `/me` | Identity | API, security | api rule | Phone updates only after OTP |
| Addresses and history | addresses | ERD address rule | Address | `/me/addresses` | Identity | Database | database rule | Soft-delete snapshot |
| In-app notices | notifications | notification types | Notification | `/me/notifications` | Notifications | Jobs | jobs rule | Commit with status change |
| Browse | catalog | channel and visibility | Product, Grandma, Season | public GETs | Catalog, Grandmas | API, performance | api, performance rules | Locale fallback, filters |
| Grandma admin | grandmas | one grandma of the month | Grandma, Recipe, VoiceMessage | `/admin/grandmas` | Grandmas | Security | security rule | Permission and unique flag |
| Products and boxes | products-and-boxes | fulfillment and channels | Product, Box, BoxItem | `/admin/products` | Catalog | Database | database rule | Shipping ban, box stock |
| Categories and seasons | categories-and-seasons | computed season | Category, Season | `/admin/categories` | Catalog | API | api rule | Hidden category |
| No server cart | cart | concept section 5 | none | none | none | Architecture | architecture rule | Route absent |
| Checkout and stock | orders | ADR-003, ADR-004 | Order, OrderItem | `/orders` | Orders | Database, performance | database, performance | Lock and release |
| Shipping | shipping | concept section 9.2 | OrderShippingDetail | order shipment route | Orders | API | api rule | Status path |
| Events | events | concept section 8 | OrderEventDetail | order routes | Orders | API | api rule | No gift |
| Gifts | gifts | concept section 7 | OrderGiftDetail | order body | Orders | API | api rule | Recipient zone fee |
| Payments | payments | ADR-005 | PaymentTransaction, Refund | `/payments` | Payments | Security, jobs | security, jobs | Webhook race |
| Reviews | reviews | 1 to 5 stars | Review | review route | Reviews | API | api rule | One per item |
| Subscriptions | subscriptions | ADR-006, ADR-007 | Subscription, SubscriptionDelivery | `/subscriptions` | Subscriptions | Jobs, database | jobs rule | Dates and refund |
| Delivery settings | delivery-settings | concept section 9 | zone, slot, country | `/admin/delivery-*` | Delivery | API | api rule | Nearest slot |
| Dashboard | dashboard | concept 11.1, Q9 | read models | `/admin/dashboard` | Reports | API | api rule | Specified cards only |
| Dues | reports | concept 11.12 | order items, deliveries | `/admin/reports/*` | Reports | Database | database rule | Fixture math |
| Customer admin read | customers-admin | concept 11.11 | User | `/admin/customers` | Identity | Security | security rule | Secret redaction |
| Super Admin | super-admin | ADR-010 | Permission, SystemSetting | `/super-admin/*` | Identity | Security | security rule | Section denial |
| Static content | static-pages | concept 3.10 | none | none | none | Architecture | architecture rule | No CMS route |
| Arabic and English | all customer-facing | ADR-009 | `*_en` columns | all | common i18n | API | api rule, LOCALIZATION.md | Two locales, one code |

Acceptance criteria live in each feature file. Engineering criteria coverage is in [QUALITY_ASSESSMENT.md](QUALITY_ASSESSMENT.md).
