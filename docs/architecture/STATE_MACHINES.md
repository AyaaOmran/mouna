# State machines

Enums are lowercase in the API and database. Status values are technical names; the customer sees the Arabic label (`spec §11`). The approved set is in [ADR-020](ARCHITECTURE_DECISIONS.md#adr-020-payment-with-order_id-and-the-simplified-order-status-set).

## Order status

```text
pending
confirmed
preparing
ready
out_for_delivery
delivered
cancelled
```

Terminal states: `delivered`, `cancelled`.

There is no `awaiting_payment`, `shipped`, `in_transit`, or `rejected` status. Rejection is a `cancelled` order with a `cancel_reason` (`spec §10.2`).

### Regular cash

`pending` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`

`pending` → `cancelled` (rejection with reason, or customer cancellation)

`confirmed` → `cancelled` by the customer or by an admin

### Regular electronic

`pending` / `unpaid` → payment success sets `payment_status = paid`; the order stays `pending`

`pending` / `paid` → `confirmed` → the same fulfillment path as cash

A failed attempt leaves the order `pending` / `unpaid`. The customer may start another transaction. There is no order payment deadline and no expiry.

### Event

`pending` / `unpaid` → payment success sets `paid`, still `pending`

`pending` / `paid` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`

`pending` → `cancelled`

An event order cannot move to `confirmed` while `unpaid` (`spec §10.2`, `§15`).

### Shipping

`pending` / `unpaid` → payment success sets `paid`, still `pending`

`pending` / `paid` → `confirmed` → `preparing` → `ready` → `out_for_delivery` (handed to the carrier, company and tracking number entered) → `delivered`

`pending` → `cancelled`

A shipping order cannot move to `confirmed` while `unpaid`. `out_for_delivery` is the only hand-over state (`spec §9.2`).

Admin fulfillment moves are one step forward on the path for that `order_type`. Skipping a step is a 409. Every accepted change writes `OrderStatusHistory`.

`is_scheduled` does not add a status. Staff move a scheduled order to `preparing` when preparation starts. The system does not move it by the clock in v1.

## Payment status

`unpaid` → `paid`

`paid` → `refunded`

There is no `failed` value on the order. A failed attempt is recorded on `PaymentTransaction`; the order stays `unpaid` and a retry creates a new transaction (`spec §10.3`; ADR-020).

A cash-on-delivery order may transition `unpaid` → `paid` only when an admin records cash collection through `PATCH /admin/orders/{orderId}` (ADR-013).

A partial refund still uses `refunded`, because the concept has no separate partial value. The `Refund.amount` holds the figure.

## Payment transaction

`pending` → `succeeded` | `failed`

No transition out of `succeeded` or `failed`. A retry creates a new row.

## Subscription

`pending_payment` → `active` | `cancelled`

`active` → `completed` | `cancelled`

Only subscriptions keep a payment deadline and the `expire-subscription` job.

## Subscription delivery

`scheduled` → `preparing` → `delivered`

`scheduled` → `cancelled`

`preparing` → `cancelled`

## Cancellation request

`pending` → `approved` | `rejected`

## Concurrency lock

The payment webhook and the subscription expiry handler take a row lock on the order or subscription inside one transaction, then re-read status. A cancelled row is not moved back to `confirmed` or `active`. A late payment success on a cancelled order leaves the order cancelled; staff record a manual refund.
