# TypeORM

- PostgreSQL only. No Sequelize path.
- Integer primary keys. `uuid` on `VoiceMessage` only.
- Money is `numeric(10,2)`.
- Wrap multi-row writes that must succeed together in one transaction.
- Lock stock rows with `FOR UPDATE` in primary-key order.
- Pass the transaction manager into methods that continue the same unit of work.
- New schema goes in a migration. See `docs/database/DATABASE_MIGRATIONS.md`.
- Relations use normal TypeORM types. CommonJS does not require a `Relation<T>` wrapper.
