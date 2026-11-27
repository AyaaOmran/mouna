# Auth

- JWT access token, 15 minutes, in the `Authorization: Bearer` header.
- Opaque refresh token, SHA-256 at rest, 30 days, rotated, revoked on logout.
- Reuse of a revoked refresh token revokes that user's remaining refresh tokens.
- OTP hash, purpose, expiry, attempts, and temporary phone live on `OtpChallenge`.
- Create the customer after registration OTP succeeds.
- Argon2id for passwords. Confirm cost parameters against OWASP at implementation time.
- `@Public()` is the only way to skip the global guard.
- Do not trust a client-supplied role.
