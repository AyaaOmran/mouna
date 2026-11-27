# Public catalog

## 1. Feature overview

Guests and customers browse categories, seasons, grandmas, products, and a public voice message.

## 2. Scope

In: read APIs. Out: admin writes.

## 3. User roles

Public.

## 4. Permissions

None.

## 5. Business rules

Only active products and active grandmas. Availability, ratings, and season status are computed. Shipping and event products appear on the general list only when `channel_regular` is also true. Voice lookup uses uuid and returns audio only when status is active.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

List and filter products. Open a grandma. Open a product. Resolve a QR uuid.

## 7. Related entities

Product, Category, Season, Grandma, Box, VoiceMessage, Review.

## 8. Related endpoints

`GET /settings/public`, `/categories`, `/seasons`, `/grandmas`, `/grandmas/{grandmaId}`, `/products`, `/products/{productId}`, `/voice-messages/{voiceMessageUuid}`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Sort is one of the OpenAPI values. `page` and `limit` follow API conventions. Unknown filters are rejected.

## 10. Security requirements

Do not expose `admin_phone` or order hours on public grandma payloads.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

This is the p95 500 ms read target. Paginate. Aggregate ratings in the query. No response cache until a measurement misses the target.

## 12. Background jobs

None.

## 13. Edge cases

English fields fall back to Arabic when `*_en` is null. Hidden products return 404 on the public detail route.

## 14. Failure scenarios

Invalid uuid returns 404.

## 15. Acceptance criteria

A guest can complete browse flows without a token. Cooked-food products never appear as shippable.

## 16. Testing requirements

Integration: channel filters and locale fallback. E2E: public product list.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Home page composition is a frontend concern. There is no CMS API.
