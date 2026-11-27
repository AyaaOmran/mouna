# API endpoints

Paths, methods, and the resource split come from the preserved list:

[API_ENDPOINTS.md](../../originals/API_ENDPOINTS.md)

Request and response schemas come from:

[openapi.yaml](../../originals/openapi.yaml)

Do not invent fields that neither file defines. Where behavior changed after those files were written, follow [API_CONTRACT_DELTAS.md](API_CONTRACT_DELTAS.md) and the ADRs. When implementation changes a contract, update a working copy of the OpenAPI file in the repository and Swagger together. Do not silently edit `originals/openapi.yaml`.

## Versioning

The major version is the URL prefix `/api/v1`. Breaking changes require a new major prefix. Additive optional fields can stay on v1.

## Groups

The original list is the inventory: auth, account, admin customers, super admin, dashboard and reports, public catalog, admin grandmas, admin catalog, reviews, subscriptions, checkout reference data, customer orders, payments, admin orders, and delivery settings.

There is no cart resource. There is no CMS resource. There is no grandma-login resource.

## Pagination

Every list uses `page` and `limit`. See the delta document. The original OpenAPI parameter name `page_size` is not the approved name.
