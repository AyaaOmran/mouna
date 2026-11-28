# Configuration and environment

Validate environment variables at startup with the existing Joi schema. Extend that schema when a feature needs a variable. Fail startup when a required value is missing.

## Required in every environment

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | Default 3000 |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | PostgreSQL |
| `REDIS_URL` | BullMQ and throttler |
| `JWT_ACCESS_SECRET` | Access token signing |
| `CORS_ORIGIN` | Comma-separated allowlist |

## Required before production OTP or payments

| Variable | Purpose |
|---|---|
| `SMS_PROVIDER` | Adapter name. Empty means the sender fails closed |
| `PAYMENT_PROVIDER` | Adapter name. Empty means payment initiation fails closed |
| `STORAGE_PROVIDER` | `local` in development. Production value is unresolved |

Do not put provider secrets in the repository. Document the variable name in this file when an ADR selects the vendor.

`ConfigService` is the only reader. Feature services do not read `process.env`.

The currency code and platform name also exist as `SystemSetting` rows because they are read through the public settings endpoint. There is no locale setting; the product is Arabic only (ADR-017). Environment variables do not override those business settings.
