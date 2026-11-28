# Security

Security is part of each feature file. This is the system checklist. Nothing here is claimed as verified until tests in [TESTING_STRATEGY.md](TESTING_STRATEGY.md) pass.

## Authentication

- Argon2id for passwords. Confirm the memory and time cost against the OWASP Password Storage Cheat Sheet during implementation. The algorithm is approved. The numeric cost is an open item.
- JWT access tokens, 15 minutes, signed with a secret from configuration. Reject `none` algorithms.
- Refresh tokens: 32 random bytes, stored as SHA-256, rotated, revoked on logout. Reuse of a revoked token revokes the user's remaining refresh tokens.
- OTP stored as a hash. Constant-time compare. Attempt counter. No OTP in logs or responses.
- Registration does not accept a client-supplied role.
- Socket.IO order monitoring authenticates the handshake with the same access-token rules as HTTP. Room subscription rechecks customer ownership or `orders.view`. The gateway accepts no state-changing command.

## Authorization

- Global auth guard. Public routes are explicit.
- Admin routes declare one function key from the catalogue.
- Customer queries include `customer_id = current user`. Missing rows are 404.

## Input and data

- Whitelist validation on every body and query DTO.
- TypeORM parameters only. No string-built SQL.
- Money and stock use numeric types.
- Errors hide SQL and stacks.
- Webhooks verify a signature inside the gateway adapter before any status change. The algorithm waits for the vendor. Unsigned webhooks are rejected.

## Abuse

- `@nestjs/throttler` with Redis storage on login, register, OTP verify, and forgot-password. Exact limits are configuration, starting point 5 requests per phone per 10 minutes for OTP endpoints. Tune after review.
- Account status `disabled` fails login.

## Files

- The storage adapter restricts content type and size for images and audio. Allowed types and the size cap are open until the storage vendor is chosen. Reject path traversal. Store the generated URL, not a client-supplied path, when the file is uploaded through the API. The OpenAPI contract currently also accepts a URL. Accepting a remote URL is only allowed for admin users and must be restricted to an approved host list once that list exists. Until then, prefer upload-through-the-adapter and treat raw URL submission as an open item.

## Platform

- Helmet and an explicit CORS allowlist from configuration.
- Secrets in environment variables, not in the repository. `.env` stays untracked.
- Dependency review in CI using `npm audit` at a high severity threshold. A failing audit blocks the pipeline once CI exists. Do not claim a clean audit until it has been run.
- Activity log for admin writes.
- Payment and OTP secrets are redacted in logs.

## Feature review

Before a feature is Implemented, confirm the feature file's security section against this list: auth, permission, ownership, validation, rate limit if the route is an auth or OTP route, and no secret in the response.
