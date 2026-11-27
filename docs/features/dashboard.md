# Admin dashboard

## 1. Feature overview

Admins see the counts and follow-up lists described in concept section 11.1.

## 2. Scope

In: `GET /admin/dashboard`. Out: a separate analytics warehouse.

## 3. User roles

Any admin or super admin.

## 4. Permissions

No section permission. The route still requires an admin role.

## 5. Business rules

Counts match the concept cards: all orders, new pending orders, preparing, new shipping, new events, awaiting payment, active subscriptions, unavailable products. Follow-up lists that are fully specified: pending review, delivery today, and out-of-stock products. "Approaching payment deadline" and "preparation starts soon" have no numeric window. Those two lists stay out of the verified dashboard until Q9 in the open questions is answered.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

One read endpoint.

## 7. Related entities

Read models over Order, Subscription, Product.

## 8. Related endpoints

`GET /admin/dashboard`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

No body.

## 10. Security requirements

Customers receive 403.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Use the status and date indexes. Do not load full order graphs to count.

## 12. Background jobs

None.

## 13. Edge cases

Super admin sees the same dashboard.

## 14. Failure scenarios

Empty database returns zeros and empty lists.

## 15. Acceptance criteria

Each card has a defined query in the service and a test.

## 16. Testing requirements

Integration: seed orders in known statuses and assert counts.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

The approaching-deadline list and the preparation-soon list are unspecified. See Q9. Do not pick a window in code.
