# HTTP

- Routes and schemas come from `docs/api/swagger.yaml` (v2.3.0). It already uses `limit` instead of `page_size`.
- The global filter emits the error envelope in `docs/api/ERROR_HANDLING.md`.
- Map PostgreSQL `23505` to 409.
- Add Swagger decorators that match the implemented contract.
- Socket.IO is limited to authenticated order-status monitoring. Its namespace, events, authorization, and recovery rules are in `docs/api/REALTIME.md`; it does not replace or extend the REST contract.
- `Accept-Language` selects message text only. See `docs/api/LOCALIZATION.md`.
