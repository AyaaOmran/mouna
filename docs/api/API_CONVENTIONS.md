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

Every list has a whitelisted `sort` or a fixed server order and ends with an `id` tie-breaker: `id DESC` for time-ordered lists, `id ASC` for name-ordered lists. `page > total_pages` returns `data: []` with correct metadata. The allow-list of unpaginated collections is in ADR-022.

## Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Arabic text",
    "details": [{ "field": "phone", "code": "IS_NOT_EMPTY", "message": "Arabic text" }],
    "request_id": "uuid"
  }
}
```

`message` is Arabic. `code` and `field` stay stable English technical names. 500 responses use a generic Arabic message and log the stack with the request id. The scaffold filter in `src/common/filters/http-exception.filter.ts` is the starting shape. Extend it to resolve the Arabic catalog. Do not replace the envelope.

| Status | Use |
|---|---|
| 401 | Missing or invalid authentication |
| 403 | Authenticated admin without the function key |
| 404 | Missing resource, including another customer's resource |
| 409 | Illegal status change, uniqueness conflict, stale price, stock conflict, or `ADDRESS_LIMIT_REACHED` when the customer already has five active saved addresses |
| 422 | Validation or business input rejection |
| 429 | Rate limit |

## Admin function permissions

`x-required-permission` names the function key checked by an admin route. The catalogue is the 26 keys in [USER_ROLES_AND_PERMISSIONS.md](../product/USER_ROLES_AND_PERMISSIONS.md) and ADR-019. A scalar key requires that key. An array lists alternative keys (OR, not AND). The special `any-admin` value is not used. Mutations require their specific key.

`PATCH /admin/orders/{orderId}` is the existing update route. It may update `delivery_responsible_note`, set `payment_status` to `paid` for a cash-on-delivery order, or do both. It requires `orders.manage_payment_shipping`. It does not create a new route.

## Validation

Global `ValidationPipe` with whitelist, forbid non-whitelisted, and transform. DTOs are classes with `class-validator`, matching the current scaffold. Do not introduce a second schema library in v1.

## Auth header

`Authorization: Bearer <access token>`. `POST /auth/refresh` and `POST /auth/logout` take `{ "refresh_token": "..." }` in the body (`RefreshTokenRequest` in `swagger.yaml`). Login, registration verification, and refresh return `access_token` and `refresh_token`. The approved design is bearer access tokens plus an opaque refresh token (ADR-008).

## Language

Arabic only. The website and dashboard are Arabic and RTL, with no language switcher. There is no `Accept-Language` header and no second message catalog (ADR-017). Field names, enums, status codes, and error codes stay English technical names.

## Swagger

Served at `/api/v1/docs`, which matches the current `main.ts` setup with the global prefix. Decorators describe the implemented contract, including deltas. Security scheme is bearer.

## Idempotency

`POST /payments/webhook` is idempotent on `gateway_reference`. Clients retry order creation only when they did not receive a response. A duplicate `pending` order is possible if the client repeats the POST. Do not add an idempotency-key header until a later ADR. Document this limitation on the orders feature.
