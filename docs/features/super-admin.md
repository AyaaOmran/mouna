# Super Admin

## 1. Feature overview

Super Admin manages admin users, the permission catalogue assignment, system settings, payment methods, commission, and the activity log.

## 2. Scope

In: the `/super-admin` routes. Out: a custom role entity.

## 3. User roles

Super Admin only.

## 4. Permissions

Role check, not a function key. Super Admin also passes every admin key check.

## 5. Business rules

New admins are created here, not through public register. Permission assignment replaces the user set with the submitted subset of the 26 keys. Selecting an edit key also grants its `*.view` key. `SystemSetting` holds the platform name, currency SYP, subscription payment deadline, and commission rate; it is seeded before launch and read-only here (`spec §26`). Payment methods are seeded and read-only. Activity log is append-only.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Create admin, set permissions, update settings, read the log.

## 7. Related entities

User, Permission, UserPermission, SystemSetting, PaymentMethod, ActivityLog.

## 8. Related endpoints

The `/super-admin` routes in the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Commission rate is a decimal from 0 through 100. Deadline minutes is a positive integer. Currency stays `SYP` unless a later ADR changes it. There is no locale field. Settings and payment methods have no write route.

## 10. Security requirements

An admin token receives 403 on these routes. Cannot demote the last super admin. Activity log records these writes.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Small tables.

## 12. Background jobs

None.

## 13. Edge cases

Public settings expose name and currency only. They hide commission and the payment deadline. Do not add commission to the public payload.

## 14. Failure scenarios

Assigning an unknown key returns 422.

## 15. Acceptance criteria

An admin without a key cannot call that route. A super admin can. Commission used by the dues report comes from this setting.

## 16. Testing requirements

E2E: create admin, assign `orders.view` only, call a product route and receive 403, call an order route and receive 200.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

The catalogue is fixed at 26 keys. There are no custom keys.
