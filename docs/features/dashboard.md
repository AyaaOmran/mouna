# Admin dashboard

## 1. Feature overview

Admins see the five summary cards and the follow-up lists defined in `spec §14`.

## 2. Scope

In: `GET /admin/dashboard`. Out: a separate analytics warehouse.

## 3. User roles

Admin with at least one `dashboard.*` key, or Super Admin.

## 4. Permissions

`dashboard.view_stats` for the cards. `dashboard.view_attention_orders` for the orders-needing-action list. `dashboard.view_upcoming_deliveries` for the upcoming-deliveries list. Blocks the caller cannot view are omitted from the response. See `spec §14`.

## 5. Business rules

Cards (`spec §14 بطاقات الملخص`):

| Card | Rule |
|---|---|
| New pending orders | `status = pending` |
| Preparing orders | `status = preparing` |
| Upcoming or due-today deliveries | Delivery date today or in the next 7 days |
| Active subscriptions | `status = active` |
| Unavailable products | No stock and not made to order, or unpublished |

Follow-up lists (`spec §14 قوائم المتابعة`):

- Orders needing action: `pending` with payment status, preparation due or approaching, due today.
- Latest orders: the 10 newest.
- Upcoming deliveries: the next 7 days, capped at 20.

The home blocks are capped, not paginated (ADR-022). There is no `awaiting_payment` card and no payment-deadline list.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

One read endpoint. Clicking a card opens the matching section with a filter applied; that is frontend behavior over the existing list endpoints.

## 7. Related entities

Read models over Order, Subscription, Product, Delivery.

## 8. Related endpoints

`GET /admin/dashboard`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

No body.

## 10. Security requirements

Customers receive 403. Each block checks its own key.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Use the status and date indexes. Do not load full order graphs to count.

## 12. Background jobs

None.

## 13. Edge cases

Super Admin sees every block. An admin with only one dashboard key sees only that block.

## 14. Failure scenarios

Empty database returns zeros and empty lists.

## 15. Acceptance criteria

Each card and list has a defined query in the service and a test. The response contains no card outside `spec §14`.

## 16. Testing requirements

Integration: seed orders in known statuses and assert counts; assert block omission by key.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

"Preparation due or approaching" uses the same 7-day window as upcoming deliveries. No separate numeric window is defined in the spec.
