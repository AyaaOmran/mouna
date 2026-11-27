# Reviews

## 1. Feature overview

A customer reviews each delivered order item once. The review is public immediately.

## 2. Scope

In: create review. Out: edit, delete, and moderation.

## 3. User roles

Customer who owns the delivered order.

## 4. Permissions

Ownership.

## 5. Business rules

Order status must be `delivered`. One review per order item. Rating is an integer from 1 to 5. Comment is optional. Grandma rating is the average of product reviews.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

POST the review. Catalog reads include the aggregate.

## 7. Related entities

Review, OrderItem, Order, Product.

## 8. Related endpoints

`POST /orders/{orderId}/items/{orderItemId}/review`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Rating 1 through 5. Comment max length follows OpenAPI, 2000.

## 10. Security requirements

The order item must belong to the order and the order to the customer. Otherwise 404.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Unique `order_item_id`. Rating aggregate is computed, not stored.

## 12. Background jobs

None.

## 13. Edge cases

A second POST returns 409.

## 14. Failure scenarios

Review before delivery returns 409.

## 15. Acceptance criteria

The product rating changes after the review commits.

## 16. Testing requirements

Integration: undelivered rejected, duplicate rejected, rating bounds.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No edit endpoint.
