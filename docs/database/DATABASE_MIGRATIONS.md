# Database migrations

- `synchronize` stays false in every environment, including tests.
- One migration per schema change, generated and committed. Name it with a timestamp and a verb, for example `1732700000000-CreateIdentityTables`.
- Migrations run once, before the new application version serves traffic. The application does not run migrations on boot.
- Expand-and-contract for any change that old code still reads: add a nullable column, deploy writers, backfill, then add the constraint in a later migration.
- Do not edit a migration that has already been applied to a shared database. Add a new one.
- Destructive drops need a backup taken first. See [BACKUP_AND_RECOVERY.md](../engineering/BACKUP_AND_RECOVERY.md).
- Seeds for the ten permissions, and any required single `SystemSetting` and `DeliverySetting` row, live in a migration or a dedicated seed that can run twice without duplicating rows.
- Tests use a separate database. They apply migrations, then truncate between tests. They do not share the development database.

Review a migration for lock time before it is merged. An index on a large table should be created concurrently when PostgreSQL allows it. v1 tables start empty, so the first migration set can build indexes inside the normal migration transaction.
