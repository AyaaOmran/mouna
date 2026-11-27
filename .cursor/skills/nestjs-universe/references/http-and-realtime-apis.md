# HTTP

- Routes and schemas come from `docs/api/swagger.yaml` (v2.2.0). It already uses `limit` instead of `page_size`.
- The global filter emits the error envelope in `docs/api/ERROR_HANDLING.md`.
- Map PostgreSQL `23505` to 409.
- Add Swagger decorators that match the implemented contract.
- Do not add a WebSocket gateway or Socket.IO. MONAT has no realtime channel in v1.
- `Accept-Language` selects message text only. See `docs/api/LOCALIZATION.md`.
