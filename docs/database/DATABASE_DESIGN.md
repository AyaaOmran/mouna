# Database design

Base model: [ERD v2](../../originals/Monat_AlJaddat_ERD_v2.md). This file is the approved delta. Entity and column names below are the ones to implement.

## New tables

### OtpChallenge

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| purpose | enum | `register`, `password_reset`, `phone_change` |
| phone | string | Required |
| code_hash | string | Never the raw code |
| expires_at | timestamptz | 5 minutes from creation |
| attempt_count | integer | Default 0, maximum 5 |
| consumed_at | timestamptz | Null until success |
| user_id | integer FK | Null for registration before the user exists |
| first_name, last_name | string | Registration only |
| password_hash | string | Registration only, Argon2id |
| new_phone | string | Phone change only |
| created_at | timestamptz | |

### RefreshToken

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| user_id | integer FK | Required |
| token_hash | string | Unique. Store a SHA-256 hash of the opaque token |
| expires_at | timestamptz | 30 days |
| revoked_at | timestamptz | Set on logout and on rotation |
| replaced_by_id | integer FK | Nullable, self |
| created_at | timestamptz | |

## Columns added to existing tables

`Order.inventory_held` boolean, not null, default false. True after a successful reservation, false after release.

Arabic is the only product language (ADR-017). There are no `*_en` columns. The existing Arabic columns keep their names; do not rename them to `name_ar`.

`SystemSetting.currency` is `SYP`. There is no `SystemSetting.language` column and no `language` field in the public settings payload.

## Changes to the base model

The ERD v2 is the base. These deltas are applied by migration.

### Order

- Status set: `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`, `delivered`, `cancelled` (ADR-020).
- `payment_status` set: `unpaid`, `paid`, `refunded`.
- Remove `payment_deadline`.
- `cancel_reason` is required when an admin rejects a `pending` order.

### Review

Replace the per-order-item review with one review per delivered order (ADR-018).

| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| order_id | integer FK | Unique, not null |
| rating | integer | 1–5 |
| comment | text | Nullable, maximum 2000 characters |
| published_at | timestamptz | Set at creation |
| created_at | timestamptz | |
| updated_at | timestamptz | |

`order_item_id` and `product_id` are removed from `Review`.

### OrderShippingDetail

Store `shipping_company_name` as free text next to `tracking_number`. Remove `shipping_company_id` and the `ShippingCompany` foreign key.

### Removed entities

Do not create these ERD entities (ADR-021):

- `Holiday` — no holiday calendar (`spec §11` item 8, `§19`, `§22`, `§30`).
- `DeliverySlot` — no weekday slot tables (`spec §9.1`, `§22`).
- `ShippingCompany` — the company name is free text on the order (`spec §9.2`, `§22`).

`DeliveryZone`, `DeliveryPeriod`, `ShippingCountry`, and `DeliverySetting` remain, as seeded reference data with no admin CRUD.

## Constraint changes

Keep the ERD checks for one default address, one grandma of the month, order and subscription totals, and made-to-order products.

Replace the payment-transaction check. The ERD forbids both foreign keys at once and still allows both to be null. The approved rule is exactly one target:

```sql
CHECK ((order_id IS NOT NULL) <> (subscription_id IS NOT NULL))
```

Add the same check to `Refund`.

`gateway_reference` stays unique. Multiple pending attempts may have a null reference until the gateway returns one. Use a partial unique index where `gateway_reference IS NOT NULL` if the gateway can omit it on creation.

## Address-book limit

Each customer may have at most 5 active saved address rows (`deleted_at IS NULL`). Historical soft-deleted rows remain available to orders/subscriptions and do not count. The application must enforce this under concurrency: in the same transaction, take a pessimistic write lock on the owning `User` entity row (`SELECT … FOR UPDATE` against its TypeORM-mapped table), count active addresses, and insert only if the count is below five. Every operation that can increase the active count must take the same parent-row lock. A referenced-address replacement must soft-delete the old row and insert the replacement atomically. Do not use a plain count without the parent-row lock; concurrent requests could both see four rows and create a sixth.

Add this partial index by migration to support the active-address lookup/count:

```sql
CREATE INDEX idx_addresses_active_by_user
  ON addresses (user_id)
  WHERE deleted_at IS NULL;
```

This complements (and does not replace) the ERD partial unique index for one default address. No `Address` column is required for the cap.

## Indexes

Keep the ERD performance indexes. Add: 

| Table | Columns | Why |
|---|---|---|
| RefreshToken | `token_hash` unique | Login refresh lookup |
| OtpChallenge | `(phone, purpose, consumed_at)` | Active challenge lookup |
| PaymentTransaction | `gateway_reference` unique | Webhook idempotency |
| Order | `(inventory_held, status)` | Release scans |

## Types and integrity

- Money and fees: `numeric(10,2)`.
- Stock and quantities: `numeric`, never floating point.
- Timestamps: `timestamptz`.
- Order item `unit_price` is a snapshot. Subscription `subtotal`, `fee_amount`, and `total_price` are snapshots.
- Address edits that are already referenced create a new row and soft-delete the old row, as in the ERD.
- Delete of a category, grandma, zone, or product that is still referenced returns 409.

## Seed data

These rows are prepared before launch and have no admin CRUD (`spec §22`, `§26`; ADR-021):

| Table | Seed |
|---|---|
| `Permission` | The 26 keys in ADR-019 |
| `SystemSetting` | One row: platform name, `currency = SYP`, commission rate, subscription payment deadline |
| `PaymentMethod` | Active methods |
| `DeliveryZone` | Service zones with a fixed `fee` |
| `DeliveryPeriod` | Fixed period list (`name`, `start_time`, `end_time`) |
| `ShippingCountry` | Supported countries with a fixed `fee` |
| `DeliverySetting` | One row: `min_preparation_hours` (default 4) |

## Stock transaction

```text
BEGIN
  lock product rows in id order
  check quantities
  decrement ready and box stock
  insert order with inventory_held = true
COMMIT
```

Lock products in primary-key order to avoid deadlocks. Release uses the order id lock, then the product locks, and clears `inventory_held` in the same transaction.
