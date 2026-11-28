# Delivery reference data

## 1. Feature overview

Delivery zones with fixed fees, a fixed period list, supported shipping countries with fixed fees, and one preparation setting are prepared before launch. There is no admin CRUD for them.

## 2. Scope

In: seeded reference data, the public read endpoints, and the nearest-delivery-date calculation. Out: holiday calendars, weekday slot tables, shipping-company accounts, operational settings pages, driver assignment, and capacity limits.

## 3. User roles

Guest and customer read active zones, countries, periods, and availability. No admin writes in v1.

## 4. Permissions

The public GETs are open. There is no `delivery` function key and no admin route.

## 5. Business rules

A local order uses an active zone and its fixed `fee`. A shipping order uses an active country and its fixed `fee`. Fees are snapshotted on the order.

The nearest-date rule (ADR-021): a date is deliverable when at least one active period starts at least `min_preparation_hours` after the current time and the date is not earlier than `today + the longest lead_time_days` in the order. Every calendar day is deliverable. There is no holiday exclusion and no capacity check. A non-scheduled order gets the earliest deliverable date and its first qualifying period.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Checkout reads zones, countries, and availability. A seed prepares the data before launch.

## 7. Related entities

DeliveryZone, DeliveryPeriod, DeliverySetting, ShippingCountry.

## 8. Related endpoints

Public `GET /delivery-zones`, `GET /shipping-countries`, `GET /payment-methods`, and `GET /delivery/availability`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Fee is `numeric(10,2)`. `start_time` is before `end_time`. `min_preparation_hours` is a non-negative integer. Deactivated rows cannot be used for new orders.

## 10. Security requirements

Deactivated rows disappear from public lists and fail checkout validation.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Availability is a small in-memory calculation over the seeded rows for the requested window. Do not cache it in Redis in v1.

## 12. Background jobs

None.

## 13. Edge cases

Changing a zone or country fee does not rewrite existing order snapshots. The availability window defaults to 14 days and is capped at 60.

## 14. Failure scenarios

An inactive zone or country at checkout is 422. A date earlier than the lead-time floor is 422.

## 15. Acceptance criteria

Availability never returns a date before the lead-time floor or a period that starts too soon. No `/admin/delivery-*`, `/admin/holidays`, `/admin/shipping-*`, or `/admin/settings/delivery` path exists.

## 16. Testing requirements

Unit: nearest-date calculation across the lead-time floor and the preparation minimum. Integration: inactive zone rejected at checkout.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No capacity per period. No admin screen; adding one needs a new ADR.
