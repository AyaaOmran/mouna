# State machines

Enums are lowercase in the API and database. Labels below match the concept.

## Order status

```text
pending
awaiting_payment
confirmed
preparing
ready
out_for_delivery
shipped
in_transit
delivered
rejected
cancelled
```

Terminal states: `delivered`, `rejected`, `cancelled`.

### Regular cash

`pending` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`

`pending` → `rejected` | `cancelled`

`confirmed` → `cancelled` by the customer, or by an admin

### Regular electronic

`awaiting_payment` → `pending` on payment success → `confirmed` → same fulfillment path as cash

`awaiting_payment` → `cancelled` on deadline

`pending` → `rejected` | `cancelled`

### Event

`pending` → `awaiting_payment` → `confirmed` → `preparing` → `ready` → `out_for_delivery` → `delivered`

`pending` → `rejected` | `cancelled`

`awaiting_payment` → `cancelled`

### Shipping

`pending` → `awaiting_payment` → `confirmed` → `preparing` → `shipped` → `in_transit` → `delivered`

`pending` → `rejected` | `cancelled`

`awaiting_payment` → `cancelled`

Admin fulfillment moves are one step forward on the path for that `order_type`. Skipping a step or using `shipped` on a local order is a 409. Every accepted change writes `OrderStatusHistory`. System expiry uses a null actor.

`is_scheduled` does not add a status. Staff move a scheduled order to `preparing` when preparation starts. The system does not move it by the clock in v1.

## Payment status

`unpaid` → `paid` | `failed`

`failed` → `paid` on a later successful attempt

`paid` → `refunded` when an admin records a refund

A partial refund still uses `refunded`, because the concept has no separate partial value. The `Refund.amount` holds the figure.

## Payment transaction

`pending` → `succeeded` | `failed`

No transition out of `succeeded` or `failed`. A retry creates a new row.

## Subscription

`pending_payment` → `active` | `cancelled`

`active` → `completed` | `cancelled`

## Subscription delivery

`scheduled` → `preparing` → `delivered`

`scheduled` → `cancelled`

`preparing` → `cancelled`

## Cancellation request

`pending` → `approved` | `rejected`

## Concurrency lock

Expiry and webhook handlers take a row lock on the order or subscription inside one transaction, then re-read status. A cancelled row is not moved back to `confirmed` or `active`.
