# API endpoints

The working contract is [swagger.yaml](swagger.yaml), OpenAPI 3.0.3, contract version 3.0.0. It is the source for every path, method, request schema, response schema, and permission key that the agent implements.

Version 3.0.0 removes the delivery-admin, holiday, slot, and shipping-company paths; the per-order-item review route; the order payment deadline; and the `awaiting_payment`, `shipped`, `in_transit`, and `rejected` statuses. It adds `POST /orders/{orderId}/review` and `OrderShippingDetail.shipping_company_name`.

The files under `originals/` (`openapi.yaml` 2.0.0, the endpoint list, and `API_CONTRACT_DELTAS.md`) are history. Do not edit them and do not implement from them.

Do not invent paths or fields that `swagger.yaml` does not define. Gaps go to [OPEN_QUESTIONS.md](../planning/OPEN_QUESTIONS.md). When implementation changes a contract, update `swagger.yaml` and the NestJS Swagger decorators together and raise the contract version.

If `swagger.yaml` disagrees with the spec, with [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md), or with the permission keys in [USER_ROLES_AND_PERMISSIONS.md](../product/USER_ROLES_AND_PERMISSIONS.md), the document higher in the authority order in the package `README.md` wins and `swagger.yaml` is the file to fix.

## Versioning

The major version is the URL prefix `/api/v1`. Breaking changes require a new major prefix. Additive optional fields can stay on v1. `info.version` in `swagger.yaml` follows semantic versioning. Removing paths or enum values is a breaking contract change and raises the minor to a major.

## Groups

Auth, account, admin customers, super admin, dashboard and reports, public catalog, admin grandmas, admin catalog, admin subscriptions, reviews, subscriptions, checkout reference data, customer orders, payments, and admin orders.

There is no cart resource. There is no CMS resource. There is no grandma-login resource. There are no delivery-admin resources: zones, periods, countries, and settings are seeded before launch (ADR-021).

Socket.IO order-status monitoring is documented separately in [REALTIME.md](REALTIME.md). It has no REST path and does not modify this OpenAPI contract.

## Pagination

Every list uses `page` and `limit`. Default 20, maximum 100. The name `page_size` from the 2.0.0 file is not used. Every response carries `meta: { page, limit, total, total_pages }`. Sort orders end with an `id` tie-breaker. The unpaginated allow-list and the dashboard top-N caps are in ADR-022.
