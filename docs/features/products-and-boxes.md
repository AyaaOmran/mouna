# Products and boxes

## 1. Feature overview

Admins manage products, images, stock, fulfillment, channels, and box contents.

## 2. Scope

In: product and box writes. Out: order creation.

## 3. User roles

Admin with `products`.

## 4. Permissions

`products`.

## 5. Business rules

One price and one sale unit. No variants. Made to order requires lead time and scheduling. Shipping channel is forbidden for cooked food. Box stock is independent of contents. A shippable box requires shippable contents. Ratings are 1 to 5 and are not stored on the product.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create product, upload images, optionally create the box extension and items.

## 7. Related entities

Product, ProductImage, Box, BoxItem, Category, Season, Grandma.

## 8. Related endpoints

`/admin/products` and image routes from the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Ready products require stock. Made-to-order stock is null. Price is a non-negative decimal with two places.

## 10. Security requirements

Image upload goes through the storage port. Reject unexpected content types once the allow list is set. Until then the development adapter allows jpeg, png, and webp under a size configured in code and recorded here when chosen.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Index `(grandma_id, category_id, status)`. Stock locks happen in the orders feature.

## 12. Background jobs

None.

## 13. Edge cases

A product on an existing order item can be hidden and still display from the order snapshot price. The live name follows the product row.

## 14. Failure scenarios

Deleting an image does not delete the product. Deleting a product referenced by an order returns 409.

## 15. Acceptance criteria

Channel and fulfillment checks match BUSINESS_LOGIC. English names are editable and nullable.

## 16. Testing requirements

Integration: cooked food cannot set shipping. Box shippable flag checks contents.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Maximum upload size is not a product decision yet. See OPEN_QUESTIONS.
