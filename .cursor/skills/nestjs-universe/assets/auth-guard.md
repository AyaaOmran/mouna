# Auth guard sketch

Use this only when implementing authentication. Behavior is normative in `docs/features/authentication.md` and `docs/engineering/SECURITY.md`.

- Global `APP_GUARD` reads the bearer token and attaches the user id and role.
- `@Public()` uses `Reflector.getAllAndOverride` on the handler and the class.
- A second guard reads the required section and allows the request when the role is `super_admin` or `UserPermission` contains that section.
- Refresh tokens are random bytes. Persist `sha256`. Compare with a timing-safe equality check.
- Logout sets `revoked_at`.

Do not copy a sample that stores the raw refresh token.
