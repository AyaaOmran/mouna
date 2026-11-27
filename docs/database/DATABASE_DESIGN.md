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

English text, all nullable. The original column stays the Arabic value. Do not rename it to `name_ar`.

| Entity | English columns |
|---|---|
| Product | `name_en`, `description_en`, `sale_unit_en`, `storage_method_en` |
| Category, Season, DeliveryZone, ShippingCountry, PaymentMethod, Holiday, DeliveryPeriod, ShippingCompany | `name_en` |
| Grandma | `name_en`, `story_en`, `bio_en` |
| Recipe | `title_en`, `content_en` |
| VoiceMessage, SubscriptionPlan | `title_en` or `name_en` matching the Arabic column |
| BoxItem | `item_name_en` |
| SystemSetting | `platform_name_en` |

`SystemSetting.language` is the default locale, `ar` or `en`, default `ar`. `SystemSetting.currency` is `SYP`.

## Constraint changes

Keep the ERD checks for one default address, one grandma of the month, order and subscription totals, and made-to-order products.

Replace the payment-transaction check. The ERD forbids both foreign keys at once and still allows both to be null. The approved rule is exactly one target:

```sql
CHECK ((order_id IS NOT NULL) <> (subscription_id IS NOT NULL))
```

Add the same check to `Refund`.

`gateway_reference` stays unique. Multiple pending attempts may have a null reference until the gateway returns one. Use a partial unique index where `gateway_reference IS NOT NULL` if the gateway can omit it on creation.

## Indexes

Keep the ERD performance indexes. Add:

| Table | Columns | Why |
|---|---|---|
| RefreshToken | `token_hash` unique | Login refresh lookup |
| OtpChallenge | `(phone, purpose, consumed_at)` | Active challenge lookup |
| PaymentTransaction | `gateway_reference` unique | Webhook idempotency |
| Order | `(inventory_held, status)` | Release and expiry scans |

## Types and integrity

- Money and fees: `numeric(10,2)`.
- Stock and quantities: `numeric`, never floating point.
- Timestamps: `timestamptz`.
- Order item `unit_price` is a snapshot. Subscription `subtotal`, `fee_amount`, and `total_price` are snapshots.
- Address edits that are already referenced create a new row and soft-delete the old row, as in the ERD.
- Delete of a category, grandma, zone, or product that is still referenced returns 409.

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
