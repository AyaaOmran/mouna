# Gifts

## 1. Feature overview

A gift is a flag and a detail row on a regular, scheduled, or shipping order.

## 2. Scope

In: gift fields on checkout. Out: a gift shop, gifts on events and subscriptions.

## 3. User roles

Customer sets the flag. Admin with `orders.view` fulfills; the gift view is a filter on the orders table, not a separate section.

## 4. Permissions

`orders.view` for the filtered list and detail. Mutations use the specific `orders.*` key.

## 5. Business rules

Recipient data replaces the customer address for local delivery. Shipping gifts reuse the shipping recipient. Wrapping type is free text. Hide-sender is a boolean. No price invoice is a fulfillment rule for staff, not a separate API.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Checkout with gift fields. Staff read them on the order.

## 7. Related entities

OrderGiftDetail, Order.

## 8. Related endpoints

Included in order create and order detail. No standalone gift resource.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

When `is_gift` is true, the OpenAPI gift object is required. Event orders reject it.

## 10. Security requirements

Customer detail includes the gift fields they submitted. Do not expose admin-only grandma contact.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

One extra insert in the order transaction.

## 12. Background jobs

None.

## 13. Edge cases

Local gift zone fee uses the recipient zone, not the customer default address.

## 14. Failure scenarios

Missing recipient fields return 422.

## 15. Acceptance criteria

`is_gift` is true and the detail row exists for a gift checkout.

## 16. Testing requirements

Integration: local fee uses the recipient zone. Event plus gift fails.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Wrapping options are not a catalogue.
