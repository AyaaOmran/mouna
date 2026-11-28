# Auth guard sketch

Use this only when implementing authentication. Behavior is normative in `docs/features/authentication.md` and `docs/engineering/SECURITY.md`.

- Global `APP_GUARD` reads the bearer token and attaches the user id and role.
- `@Public()` uses `Reflector.getAllAndOverride` on the handler and the class.
- A second guard reads the required function key and allows the request when the role is `super_admin` or `UserPermission` contains that key (ADR-019). An edit key requires its matching `*.view` key.
- Refresh tokens are random bytes. Persist `sha256`. Compare with a timing-safe equality check.
- Logout sets `revoked_at`.

Do not copy a sample that stores the raw refresh token.
