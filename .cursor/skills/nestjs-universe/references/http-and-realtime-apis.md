# HTTP

- Routes and schemas come from `docs/api/swagger.yaml` (v3.0.0). Collections use `page` and `limit`; `page_size` is not used.
- The global filter emits the error envelope in `docs/api/ERROR_HANDLING.md`. Messages are Arabic only (ADR-017).
- Map PostgreSQL `23505` to 409.
- Admin decorators use one of the 26 function keys in `docs/product/USER_ROLES_AND_PERMISSIONS.md` (ADR-019).
- Add Swagger decorators that match the implemented contract.
- Socket.IO is limited to authenticated order-status monitoring. Its namespace, events, authorization, and recovery rules are in `docs/api/REALTIME.md`; it does not replace or extend the REST contract.
- There is no `Accept-Language`, no second message catalog, and no `*_en` field. Field names, enums, status codes, error codes, permission keys, endpoints, and database columns stay English technical names.
