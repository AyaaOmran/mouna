# Backup and recovery

Payments, orders, and stock make a backup necessary before production migrations. The host and the backup tool are not selected. The rules below still apply.

- Take a logical backup before every production migration.
- Keep the backup until the new version has served real checkouts.
- Restore drills are required before the first production launch. Record the drill in the progress log. Until a host exists, the drill cannot be executed and production launch stays blocked.
- Point-in-time recovery is desirable and not designed here, because it depends on the host.
- Redis holds queues, not the ledger. Losing Redis may delay OTP, expiry, and reminders. The sweep jobs repair expiry and reminders. OTP challenges remain in PostgreSQL and the user can start again through the existing endpoints. Do not store the only copy of an order in Redis.
- A failed migration stops the deploy. Do not start the new application on a half-migrated schema.
