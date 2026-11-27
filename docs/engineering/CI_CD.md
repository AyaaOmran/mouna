# CI/CD

The provider is not selected. This design is the pipeline contract. Do not add a GitHub Actions, GitLab CI, or other vendor file until an ADR names the provider. The scaffold `.github/workflows/ci.yml` is not adopted. It targets Node 24 and the Vitest script.

## Source control

- `main` is the integration branch.
- Work happens on short-lived branches.
- Merge through a pull request with a review.
- The existing scaffold mentions `develop`. This policy does not use it.

## CI stages

CI does not deploy.

1. Install with `npm ci` on Node.js 26 Active LTS.
2. Prettier check and oxlint.
3. TypeScript build.
4. Unit tests.
5. Integration and e2e tests against PostgreSQL 19 and Redis. The job fails if those services are not provided.
6. `npm audit` at high severity or above.
7. Migration check: migrations apply on an empty database.

## CD stages

CD starts only after the host is chosen.

1. Build the CommonJS output.
2. Back up the database.
3. Run migrations once.
4. Start the new version.
5. Smoke-check `/api/v1` health. A health route is not in the endpoint list. Add it only as an operational route under a later ADR, or probe an existing public `GET /settings/public` until then.
6. Roll back by redeploying the previous build. Roll the database backward only with a prepared down migration and a backup. Do not improvise a down migration during an incident.

## Environments

`development`, `test`, and `production` are the approved names already validated in the scaffold. Configuration rules are in [CONFIGURATION_AND_ENVIRONMENT.md](CONFIGURATION_AND_ENVIRONMENT.md). Secrets differ per environment. Test data is not production data.

## Release verification

A production release is not Verified in the feature table. Record the deployed commit and the smoke result in the progress log. Feature Verified means tests passed, not that production was deployed.
