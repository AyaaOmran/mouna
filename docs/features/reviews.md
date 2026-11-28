# Reviews

## 1. Feature overview

A customer reviews each delivered order once. The review is public immediately. Approved in [ADR-018](../architecture/ARCHITECTURE_DECISIONS.md#adr-018-one-review-per-delivered-order), which replaces the spec's per-product review.

## 2. Scope

In: create a review for a delivered order, and expose the aggregates on grandmas and products. Out: edit, delete, moderation, and public comment lists.

## 3. User roles

Customer who owns the delivered order.

## 4. Permissions

Ownership. No admin route and no function key.

## 5. Business rules

Order status must be `delivered`. One review per order, enforced by a unique `order_id`. Rating is an integer from 1 to 5. Comment is optional and at most 2000 characters. The review is published immediately at `published_at`.

Grandma `avg_rating` is the average of the ratings of her delivered orders. Product `rating_avg` is the average of the ratings of delivered orders that contain the product. Both are computed, not stored. Subscription deliveries are not reviewable.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

The customer opens a delivered order and POSTs the review. Catalog and grandma reads include the aggregates.

## 7. Related entities

Review, Order, OrderItem, Grandma, Product.

## 8. Related endpoints

`POST /orders/{orderId}/review`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Rating 1 through 5. Comment maximum 2000 characters. `order_id` must be present and unique.

## 10. Security requirements

The order must belong to the customer. Otherwise 404. Another customer's order is indistinguishable from a missing one.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Unique index on `Review.order_id`. Aggregates are computed with a join over delivered orders; add the index support described in [PERFORMANCE_AND_SCALABILITY.md](../engineering/PERFORMANCE_AND_SCALABILITY.md).

## 12. Background jobs

None.

## 13. Edge cases

A second POST returns `409 REVIEW_ALREADY_EXISTS`. An order with only a box or a made-to-order item still gets one review.

## 14. Failure scenarios

Review before delivery returns `409 ORDER_NOT_DELIVERED`. A missing or foreign order returns 404.

## 15. Acceptance criteria

The review commits once. Grandma and product aggregates change after commit. No public comment list exists.

## 16. Testing requirements

Integration: undelivered rejected, duplicate rejected, rating bounds, ownership isolation, aggregate recomputation. Unit: aggregate query.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No edit endpoint. No moderation. Comments are stored but not displayed as a list.
