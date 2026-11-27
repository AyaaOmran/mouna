# Feature catalog

V1 backend features. Frontend-only items are included so the agent does not add a backend for them. Status starts at Not Started. See [IMPLEMENTATION_STATUS.md](../planning/IMPLEMENTATION_STATUS.md).

| Feature | Document | Backend module | Depends on |
|---|---|---|---|
| Authentication and OTP | [authentication.md](../features/authentication.md) | Identity | Redis, SMS interface |
| Account profile | [account.md](../features/account.md) | Identity | Authentication |
| Addresses | [addresses.md](../features/addresses.md) | Identity | Authentication, delivery zones |
| In-app notifications | [notifications.md](../features/notifications.md) | Notifications | Authentication |
| Public catalog | [catalog.md](../features/catalog.md) | Catalog | Categories, products |
| Grandmas, recipes, voice | [grandmas.md](../features/grandmas.md) | Grandmas | Identity for admin |
| Products and boxes | [products-and-boxes.md](../features/products-and-boxes.md) | Catalog | Grandmas, categories |
| Categories and seasons | [categories-and-seasons.md](../features/categories-and-seasons.md) | Catalog | Identity for admin |
| Cart boundary | [cart.md](../features/cart.md) | none | Frontend LocalStorage |
| Orders, scheduling, checkout | [orders.md](../features/orders.md) | Orders | Catalog, addresses, delivery settings |
| Shipping orders | [shipping.md](../features/shipping.md) | Orders | Orders, shipping countries |
| Event orders | [events.md](../features/events.md) | Orders | Orders, delivery zones |
| Gifts | [gifts.md](../features/gifts.md) | Orders | Orders |
| Payments and refunds | [payments.md](../features/payments.md) | Payments | Orders, subscriptions |
| Reviews | [reviews.md](../features/reviews.md) | Reviews | Orders |
| Subscriptions | [subscriptions.md](../features/subscriptions.md) | Subscriptions | Catalog, addresses, payments |
| Delivery and shipping settings | [delivery-settings.md](../features/delivery-settings.md) | Delivery | Identity permissions |
| Admin dashboard | [dashboard.md](../features/dashboard.md) | Reports | Orders, subscriptions |
| Reports and grandma dues | [reports.md](../features/reports.md) | Reports | Orders, subscriptions |
| Admin customers | [customers-admin.md](../features/customers-admin.md) | Identity | Authentication |
| Super Admin | [super-admin.md](../features/super-admin.md) | Identity | Authentication |
| Static pages | [static-pages.md](../features/static-pages.md) | none | Frontend content |

Deferred, from concept section 17: multi-grandma carts, grandma accounts, automatic capacity limits, per-country shipping eligibility, pickup, driver role, event quotes, gifts on events or subscriptions, SMS or WhatsApp notifications beyond OTP, automatic grandma payout, server-side cart, CMS, coupons, review moderation.

## Jobs that are actually asynchronous

| Job | Why it is queued |
|---|---|
| Send OTP SMS | External provider, retries, backoff |
| Expire unpaid order | Delayed, plus a sweep if the delayed job was missed |
| Expire unpaid subscription | Same pattern |
| Upcoming subscription-delivery notice | Delayed until 24 hours before the delivery date, plus a sweep |

Payment webhooks, stock reservation, delivery-row creation, and in-app notification inserts run in the database transaction. They are not queued. See [BACKGROUND_JOBS.md](../engineering/BACKGROUND_JOBS.md).
