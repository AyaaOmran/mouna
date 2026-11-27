# Categories and seasons

## 1. Feature overview

Admins manage categories and seasons used to filter the catalog and group plans.

## 2. Scope

In: category and season writes. Out: automatic season status storage.

## 3. User roles

Admin with `categories`.

## 4. Permissions

`categories`.

## 5. Business rules

Category status is `active` or `hidden`. Season status is computed from dates. A seasonal subscription does not require a season row.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create and update. No public write.

## 7. Related entities

Category, Season, Product, SubscriptionPlan.

## 8. Related endpoints

`/admin/categories`, `/admin/seasons`, and the public GET routes.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Unique category name. Season end is on or after start.

## 10. Security requirements

Hidden categories are omitted from the public list.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Small reference tables. No cache.

## 12. Background jobs

None.

## 13. Edge cases

Hiding a category hides its products from public lists.

## 14. Failure scenarios

Delete is not in the endpoint list. Do not add a delete route. Hide the row instead.

## 15. Acceptance criteria

Public category list returns active rows only.

## 16. Testing requirements

Integration: hidden category excluded. Unique name returns 409.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

The concept examples are cooked food, pantry, and boxes. They are seed data, not hard-coded checks, except the cooked-food shipping ban which keys off the category used for cooked food. How that category is identified is an open question if the name is editable.
