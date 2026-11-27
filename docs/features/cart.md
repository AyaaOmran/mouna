# Cart boundary

## 1. Feature overview

The cart is frontend LocalStorage. The backend does not store carts.

## 2. Scope

In: none. The preview and create endpoints are the orders feature. Out: a cart API, multi-device sync.

## 3. User roles

The frontend requires login before add-to-cart. The backend sees the cart only when preview or create is called.

## 4. Permissions

None on a cart resource.

## 5. Business rules

One order type and one grandma per submission. Mixing is a `CART_CONFLICT` on preview or create. The frontend may warn first. The backend still checks.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

No server flow.

## 7. Related entities

None.

## 8. Related endpoints

None. Do not add `/cart`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Not applicable.

## 10. Security requirements

Do not trust client prices.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Not applicable.

## 12. Background jobs

None.

## 13. Edge cases

A stale local price is handled by order preview with `PRICE_CHANGED`.

## 14. Failure scenarios

Not applicable.

## 15. Acceptance criteria

No cart table exists after implementation.

## 16. Testing requirements

A test that `POST /cart` is not registered.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Server-side carts are deferred by the concept.
