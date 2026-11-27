# Background jobs

Redis and BullMQ are required. `@nestjs/bullmq` is the integration. Three queues are enough.

| Queue | Jobs | Owner |
|---|---|---|
| `otp` | `send-otp` | Identity |
| `payments` | `expire-order`, `expire-subscription`, repeatable `expire-sweep` | Orders and Subscriptions |
| `notifications` | `delivery-reminder`, repeatable `reminder-sweep` | Notifications |

## Policy

- Attempts: 5.
- Backoff: exponential, 30 seconds.
- Remove completed jobs after 24 hours. Keep failed jobs for inspection.
- `jobId` is deterministic: `otp:<challengeId>`, `expire-order:<orderId>`, `expire-subscription:<subscriptionId>`, `remind-delivery:<deliveryId>`.
- A repeatable sweep runs every 5 minutes and enqueues missing delayed jobs. The sweep itself uses a fixed job id so two workers do not double-schedule it. BullMQ job ids stop duplicate execution of the same id while it exists.

## What stays in the request transaction

- Stock reservation and release.
- Order, payment, and subscription status changes.
- Creation of subscription delivery rows.
- Insert of in-app notifications, except the 24-hour reminder, which is queued because it waits.
- Webhook application after signature verification.

Queue-after-commit: write the database row, commit, then enqueue. If enqueue fails, the sweep repairs expiry and reminders. OTP send failure leaves the challenge in place. The client can request a new code only through the existing register or forgot-password endpoint. Do not add a resend endpoint that the API list does not contain.

## Expiry

The delayed job runs at `payment_deadline`. It locks the row. It cancels only `awaiting_payment` orders and `pending_payment` subscriptions that are still unpaid. It releases order stock when `inventory_held` is true. It writes history and the timeout notification.

## Reminder

The job runs 24 hours before `delivery_date`. If the delivery is no longer `scheduled`, it does nothing. The notification type is `subscription_delivery_upcoming`.

## Failure and recovery

Failed jobs stay in the BullMQ failed set. There is no product endpoint to retry them. Recovery is an operational action against Redis, documented for whoever runs the process. A vendor dashboard such as Bull Board is not added in v1.

Workers must be idempotent. Expiry checks status before writing. OTP send checks that the challenge is unconsumed.

## Monitoring

Log job name, id, and failure reason. Do not log OTP values or gateway secrets. A healthy worker logs completed and failed counts. No metrics vendor is selected. See [LOGGING_AND_MONITORING.md](LOGGING_AND_MONITORING.md).
