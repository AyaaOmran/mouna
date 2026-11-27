# API conventions

## Protocol

- JSON over HTTPS in deployed environments.
- Prefix `/api/v1`.
- Resource names are plural nouns already fixed by the endpoint list.
- Use the HTTP methods already fixed there. Do not add PATCH or PUT variants that the list does not contain.

## Success bodies

A single resource is the object itself. A list is:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "total_pages": 0 }
}
```

`limit` replaces the OpenAPI name `page_size`. Default 20. Values below 1 or above 100 are 422.

## Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "localized text",
    "details": [{ "field": "phone", "code": "IS_NOT_EMPTY", "message": "localized text" }],
    "request_id": "uuid"
  }
}
```

`message` is the only localized part. `code` and `field` stay stable. 500 responses use a generic message and log the stack with the request id. The scaffold filter in `src/common/filters/http-exception.filter.ts` is the starting shape. Extend it for localization. Do not replace the envelope.

| Status | Use |
|---|---|
| 401 | Missing or invalid authentication |
| 403 | Authenticated admin without the section permission |
| 404 | Missing resource, including another customer's resource |
| 409 | Illegal status change, uniqueness conflict, stale price, stock conflict, or `ADDRESS_LIMIT_REACHED` when the customer already has five active saved addresses |
| 422 | Validation or business input rejection |
| 429 | Rate limit |

## Admin section permissions

`x-required-permission` names the access rule checked by an admin route. A scalar section name requires that section. The special scalar `any-admin` means any authenticated admin and is used only by the dashboard; it is not a grantable `Permission` section. An array lists alternative sections (OR, not AND) for a read-only view; the service must still scope the returned rows to the relevant view. This applies to the event/gift order views and to the category/season reference lists used by product editors. Mutations continue to require their owning section.

`PATCH /admin/orders/{orderId}` is the existing update route. It may update `delivery_responsible_note`, set `payment_status` to `paid` for a cash-on-delivery order, or do both. It does not create a new route.

## Validation

Global `ValidationPipe` with whitelist, forbid non-whitelisted, and transform. DTOs are classes with `class-validator`, matching the current scaffold. Do not introduce a second schema library in v1.

## Auth header

`Authorization: Bearer <access token>`. `POST /auth/refresh` and `POST /auth/logout` take `{ "refresh_token": "..." }` in the body (`RefreshTokenRequest` in `swagger.yaml`). Login, registration verification, and refresh return `access_token` and `refresh_token`. The approved design is bearer access tokens plus an opaque refresh token (ADR-008).

## Language

`Accept-Language: ar` or `en`. See [LOCALIZATION.md](LOCALIZATION.md).

## Swagger

Served at `/api/v1/docs`, which matches the current `main.ts` setup with the global prefix. Decorators describe the implemented contract, including deltas. Security scheme is bearer.

## Idempotency

`POST /payments/webhook` is idempotent on `gateway_reference`. Clients retry order creation only when they did not receive a response. A duplicate unpaid `awaiting_payment` order is possible if the client repeats the POST. Do not add an idempotency-key header until a later ADR. Document this limitation on the orders feature.
