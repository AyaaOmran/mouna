# Error handling

Throw Nest HTTP exceptions, or a small domain exception mapped by the global filter. Services do not write HTTP JSON by hand.

## Codes

Use stable codes. Add a code only when a feature needs one, and add both Arabic and English messages in the same change.

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 422 | DTO validation |
| `UNAUTHORIZED` | 401 | Auth failed |
| `FORBIDDEN` | 403 | Admin permission missing |
| `NOT_FOUND` | 404 | Hidden or missing |
| `CONFLICT` | 409 | Generic conflict |
| `PRICE_CHANGED` | 409 | Catalog price or stock changed since preview |
| `INVALID_TRANSITION` | 409 | State machine rejection |
| `OTP_INVALID` | 422 | Wrong, expired, or too many attempts |
| `CART_CONFLICT` | 422 | Channel, grandma, or scheduling mix is illegal |
| `OUT_OF_STOCK` | 409 | Reservation failed |
| `PAYMENT_WINDOW_CLOSED` | 409 | Deadline passed |

The filter logs 5xx with the request id and does not put the exception message in the response. 4xx messages come from the localization catalog.

PostgreSQL unique violation `23505` maps to 409. Do not return SQL text.

Business rules live in services. The filter does not decide whether an order can be cancelled.
