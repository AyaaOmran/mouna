# Localization

Approved in ADR-009.

## Selection

1. Read `Accept-Language`.
2. Use `ar` or `en` when that tag, or a prefix of it such as `ar-SY` or `en-US`, is present. The first supported tag in the header wins.
3. Otherwise use `SystemSetting.language`, which defaults to `ar`.
4. If that value is missing or invalid, use `ar`.

Business logic runs once. Only the message catalog and catalog field selection depend on the locale.

## What changes with language

Localized: success messages, validation messages, error messages, auth messages, business-rule messages, and notification text stored at creation.

Not localized: JSON field names, enum values, error codes, HTTP status, ids, money, dates, and phone numbers.

## API messages

Keep a message map in the repository, keyed by code and locale. Do not add `@nestjs/i18n` unless a later ADR says the map is insufficient. Two locales do not justify a new framework.

Validation messages from `class-validator` must be replaced with catalog messages so English and Arabic both exist. The constraint name stays in `details[].code`.

## Database content

Arabic remains in the original columns (`name`, `description`, and the rest). English is the nullable `*_en` column listed in [DATABASE_DESIGN.md](../database/DATABASE_DESIGN.md).

The response field is still `name`. For `en`, use `name_en` when it is non-empty, otherwise `name`. For `ar`, always use `name`.

Do not add a `translations` table.

## Notifications

Insert `type` plus `message`. `message` is rendered from the catalog in the requester's locale, or in the default locale for system jobs. The expiry job and the reminder job use the customer's last known preference when one exists. No preference column is defined. Those jobs use the default locale until a preference is approved. This limit is listed in [OPEN_QUESTIONS.md](../planning/OPEN_QUESTIONS.md).

## Agent language

Code, comments, docs, and agent instructions stay in English. The Arabic concept stays the product source.
