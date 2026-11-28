# Admin customers

## 1. Feature overview

Admins read customer accounts and their order and subscription history.

## 2. Scope

In: list and detail. Out: editing a customer, disabling them. Disabling is not in the endpoint list. Do not add it here. Super Admin can disable admins in that feature. Customer disable is unspecified.

## 3. User roles

Admin with `customers.*` keys.

## 4. Permissions

`customers.view` for the list and profile; `customers.view_addresses` for addresses; `customers.view_orders_subscriptions` for order and subscription history.

## 5. Business rules

Read only. Detail includes order and subscription summaries, not secrets.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

List with pagination. Open one customer.

## 7. Related entities

User, Order, Subscription.

## 8. Related endpoints

`GET /admin/customers`, `GET /admin/customers/{customerId}`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Pagination only.

## 10. Security requirements

Do not return password or token hashes. Role filter is customers only, so admin accounts are not listed here.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Paginate. Index users by role and phone.

## 12. Background jobs

None.

## 13. Edge cases

Unknown id returns 404.

## 14. Failure scenarios

Not applicable beyond 404 and 403.

## 15. Acceptance criteria

A customer row is visible and an admin row is not on this list.

## 16. Testing requirements

Integration: role filter and secret redaction.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No disable-customer endpoint.
