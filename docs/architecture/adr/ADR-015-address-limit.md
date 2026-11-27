# ADR-015: Maximum five active saved addresses

**Status:** Accepted, 28 November 2026.

A customer may store no more than five active saved address-book entries (`deleted_at IS NULL`). Soft-deleted rows retained for order and subscription history do not count. Free-text recipient addresses on event, gift, and shipping orders are outside this cap. A sixth active address returns `409 ADDRESS_LIMIT_REACHED`.

The create operation must run transactionally and lock the owning `User` row with `SELECT ... FOR UPDATE` before counting and inserting. Every operation that increases the active count must use the same lock. Replacement of a referenced address soft-deletes the old row and inserts the new row in one transaction, preserving the active count. Add the supporting partial index through a migration.
