# API endpoints

The working contract is [swagger.yaml](swagger.yaml), OpenAPI 3.0.3, contract version 2.3.0. It is the source for every path, method, request schema, response schema, and permission name that the agent implements.

It contains every path of the preserved original list ([originals/API_ENDPOINTS.md](../../originals/API_ENDPOINTS.md)) plus one addition: `POST /auth/refresh`, approved in ADR-008.

The files under `originals/` (`openapi.yaml` 2.0.0, the endpoint list, and `API_CONTRACT_DELTAS.md`) are history. Do not edit them and do not implement from them.

Do not invent paths or fields that `swagger.yaml` does not define. Gaps go to [OPEN_QUESTIONS.md](../planning/OPEN_QUESTIONS.md). When implementation changes a contract, update `swagger.yaml` and the NestJS Swagger decorators together and raise the contract version.

If `swagger.yaml` disagrees with an ADR, with [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md), or with the permission names in [USER_ROLES_AND_PERMISSIONS.md](../product/USER_ROLES_AND_PERMISSIONS.md), the document higher in the authority order in the package `README.md` wins and `swagger.yaml` is the file to fix.

## Versioning

The major version is the URL prefix `/api/v1`. Breaking changes require a new major prefix. Additive optional fields can stay on v1. `info.version` in `swagger.yaml` follows semantic versioning.

## Groups

Auth, account, admin customers, super admin, dashboard and reports, public catalog, admin grandmas, admin catalog, admin subscriptions, reviews, subscriptions, checkout reference data, customer orders, payments, admin orders, and delivery settings.

There is no cart resource. There is no CMS resource. There is no grandma-login resource.

## Pagination

Every list uses `page` and `limit`. Default 20, maximum 100. The name `page_size` from the 2.0.0 file is not used.
