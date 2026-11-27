# Addresses

## 1. Feature overview

Customers save up to **5 active delivery addresses** in active service zones, with one default address. Soft-deleted historical rows do not count toward the limit.

## 2. Scope

In: CRUD for own addresses and default selection. Out: order snapshots.

## 3. User roles

Customer. Admin does not edit customer addresses through these routes.

## 4. Permissions

Ownership. Another customer address id returns 404.

## 5. Business rules

Zone must be active. A customer may have at most 5 active saved addresses (`deleted_at IS NULL`); historical soft-deleted rows do not count. Creating a sixth active address returns `409 ADDRESS_LIMIT_REACHED`. One default per user among active rows. Editing an address already used by an order or subscription inserts a new row and soft-deletes the old one atomically, so it does not increase the active count. The cap does not include free-text recipient addresses on event, gift, or shipping orders.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

List, create, get, update, delete. Delete sets `deleted_at`.

## 7. Related entities

Address, DeliveryZone, Order, Subscription.

## 8. Related endpoints

`GET/POST /me/addresses`, `GET/PUT/DELETE /me/addresses/{addressId}`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

City, street, phone, and zone are required. Access details are optional.

## 10. Security requirements

Queries filter by the current user and `deleted_at IS NULL`.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Partial unique index for the default address, from the ERD. Add a partial index on active addresses by `user_id` to support the count and list queries. The create transaction locks the owning user row before counting active addresses and inserting, so concurrent creates cannot exceed the limit.

## 12. Background jobs

None.

## 13. Edge cases

Deleting the default promotes nothing automatically. The client sets a new default. A soft-deleted address is not listed and cannot be selected at checkout.

## 14. Failure scenarios

Unknown or inactive zone returns 422. Creating a sixth active saved address returns 409 `ADDRESS_LIMIT_REACHED`.

## 15. Acceptance criteria

Historical orders still point at the old address row after an edit.

## 16. Testing requirements

Integration: (1) update of a referenced address keeps the old row and creates a new one without changing the active count; (2) two defaults cannot exist; (3) the sixth active saved address returns 409 and is not inserted; (4) soft-deleted historical rows do not count; (5) simultaneous create requests cannot result in more than five active addresses.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No map coordinates. No address verification provider.
