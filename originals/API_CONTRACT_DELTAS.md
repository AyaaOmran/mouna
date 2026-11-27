# API contract deltas

The preserved OpenAPI file is still the field-level source. These approved changes win where they conflict.

| Topic | OpenAPI or concept | Approved behavior |
|---|---|---|
| List query | `page_size` | `limit` |
| List meta | `page_size` | `limit` |
| Regular electronic pay | `POST /payments` with no order, then `POST /orders` links it | `POST /orders` creates `awaiting_payment` first. `POST /payments` receives `order_id` |
| Payment owner | Transaction may have both foreign keys null | Exactly one of `order_id` or `subscription_id` |
| Regular electronic status | Order is created already `pending` and `paid` | Created `awaiting_payment`. Success moves it to `pending` and `paid` |
| Refund | Both foreign keys nullable without an XOR check | Exactly one target |
| Language | Not specified | `Accept-Language`, default Arabic, localized messages |
| Catalog text | One language column | Same JSON field, value chosen from Arabic or `*_en` |
| Rating | Minimum 1, maximum omitted | Integer 1 through 5 |
| Permission names | Several admin operations marked TBD | Section catalogue in the roles document |
| Token format | Left open | JWT access token, opaque refresh token |
| Pagination cap | 100 | Keep 100 as the maximum `limit` |

Do not change these without a new ADR:

- Path strings in the endpoint list.
- Enum values such as `regular`, `shipping`, `event`, `pending`, `awaiting_payment`.
- Money as a decimal string or number with two fraction digits, never a binary float in persistence.
- Computed fields remain read-only: `can_cancel`, `cancel_deadline`, ratings, availability, season status, delivery counts.

`gateway_action` on payment initiation stays a transient object. Its inner fields depend on the future gateway and must not be invented as a permanent schema. Until a vendor is chosen, the fake adapter used in tests returns a deterministic test payload and production configuration fails closed if no adapter is configured.
