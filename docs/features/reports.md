# Reports and grandma dues

## 1. Feature overview

Admins read sales, subscription, and grandma-dues reports. Dues are informational.

## 2. Scope

In: the three report routes. Out: paying grandmas.

## 3. User roles

Admin with `reports`.

## 4. Permissions

`reports`.

## 5. Business rules

Sales filter by period, order type, and grandma. Subscription report counts active, completed, and delivered deliveries. Dues use delivered order item value excluding fees, then commission. Each delivered subscription delivery adds an equal share of the plan subtotal. Platform share is value times `commission_rate`. Grandma due is the remainder.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

GET with a date range.

## 7. Related entities

Order, OrderItem, Subscription, SubscriptionDelivery, SystemSetting.

## 8. Related endpoints

`GET /admin/reports/sales`, `/admin/reports/subscriptions`, `/admin/reports/grandma-dues`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

From date is on or before to date. Range is required.

## 10. Security requirements

No customer access. The report does not include admin phone numbers.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Aggregate in SQL for the requested range. The p95 target for catalog reads is not this report. A long range may be slower. No warehouse in v1.

## 12. Background jobs

None.

## 13. Edge cases

Refunded orders that are still delivered remain in the product value until a later ADR says otherwise. The concept counts delivered orders and does not mention subtracting refunds. Do not subtract them silently.

## 14. Failure scenarios

Missing commission rate returns 409 `CONFLICT` rather than treating it as zero.

## 15. Acceptance criteria

A fixture with one delivered order and one delivered subscription delivery matches hand-computed dues.

## 16. Testing requirements

Integration: the fixture above. Permission 403.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Refunds are not subtracted. No export file endpoint exists.
