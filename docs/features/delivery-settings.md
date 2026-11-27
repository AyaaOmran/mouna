# Delivery and shipping settings

## 1. Feature overview

Admins configure zones, periods, slots, holidays, preparation minimum, countries, and shipping companies.

## 2. Scope

In: the settings routes. Out: assigning a driver.

## 3. User roles

Admin with `delivery`. Public can list active zones, countries, and delivery availability.

## 4. Permissions

`delivery`. Public GETs are open.

## 5. Business rules

Nearest slot uses active periods, slots, holidays, and `min_preparation_hours`. Fees are preset. Countries and zones can be deactivated and then cannot be used for new orders.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Admin maintains reference data. Checkout reads it.

## 7. Related entities

DeliveryZone, DeliveryPeriod, DeliverySlot, Holiday, DeliverySetting, ShippingCountry, ShippingCompany.

## 8. Related endpoints

Public `/delivery-zones`, `/shipping-countries`, `/payment-methods`, `/delivery/availability`, and the `/admin` routes in the endpoint list.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Fee is `numeric(10,2)`. Weekday on a slot is 0 through 6. Holiday date is unique.

## 10. Security requirements

Deactivated rows disappear from public lists and fail checkout validation.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Availability is a small in-memory calculation over the reference rows for the requested horizon. Do not cache it in Redis in v1.

## 12. Background jobs

None.

## 13. Edge cases

Changing a zone fee does not rewrite existing order snapshots.

## 14. Failure scenarios

Deleting a period that slots still use returns 409. The endpoint list allows period delete. Honor the foreign key.

## 15. Acceptance criteria

Availability never returns a holiday or a slot before now plus minimum preparation.

## 16. Testing requirements

Unit: nearest-slot calculation. Integration: inactive zone rejected at checkout.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No capacity per slot.
