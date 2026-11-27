# Technology stack

Pins below are the latest stable releases published on the npm registry or the vendor release page on 27 November 2026. Implementation must re-check the patch version on the day dependencies are installed and record any newer patch in the progress log. Do not move to a new major without an ADR.

| Component | Version | Source |
|---|---|---|
| Node.js | 26.x Active LTS, not below 26.13.1 | [Node.js 26.13.1](https://nodejs.org/en/blog/release/v26.13.1), 11 November 2026. Active LTS line from the [release schedule](https://github.com/nodejs/Release) |
| PostgreSQL | 19.0 | [Versioning policy](https://www.postgresql.org/support/versioning/), current minor 19.0, released 19 November 2026. 18.7 is the fallback only when the host has no PostgreSQL 19 packages |
| NestJS core, common, platform-express, testing | 12.6.3 | `npm view` on 27 November 2026. Peers: `rxjs` ^7.1.0, `reflect-metadata` ^0.2.0 |
| @nestjs/swagger | 12.1.3 | Peer accepts TypeScript ^5.5 or ^6 and Nest ^12 |
| @nestjs/config | 12.1.1 | npm `latest` |
| @nestjs/typeorm | 12.0.3 | Peer accepts `typeorm` ^0.3.0 or ^1.0.0-dev and Nest 10–12 |
| @nestjs/bullmq | 12.0.2 | Peer accepts `bullmq` 3–6 and Nest 10–12 |
| @nestjs/throttler | 6.8.0 | Peer accepts Nest 12 |
| @nestjs/cli | 12.0.15 | npm `latest`. Generators need Node 22.22.3+, 24.15+, or 26+ |
| TypeORM | 1.1.3 | npm `latest`. Already resolved with `@nestjs/typeorm` 12.0.3 in this repository |
| RxJS | 7.8.2 | npm `latest` on the 7.x line required by Nest |
| TypeScript | 6.0.2 | Already in the scaffold. Swagger's peer accepts ^6.0.0. Do not jump to a newer TypeScript major without checking that peer |
| pg | 8.23.1 | npm `latest` |
| BullMQ | 6.7.10 | npm `latest`, inside the Nest peer range |
| ioredis | 6.1.0 | npm `latest` |
| class-validator | 0.15.1 | npm `latest` |
| class-transformer | 0.5.1 | npm `latest` |
| argon2 | 0.45.2 | npm `latest` |
| Joi | 18.3.2 | Already used by `ConfigModule` in the scaffold |
| Helmet | 8.3.0 | npm `latest` |
| Jest | 30.5.2 | npm `latest` |
| ts-jest | 29.4.15 | Peer accepts Jest 29 or 30 and TypeScript below 7 |
| @types/jest | 30.0.0 | npm `latest` |
| supertest | 7.3.2 | npm `latest` |
| reflect-metadata | 0.2.2 | Satisfies the Nest 12 peer and is already in the scaffold |

## Module system and tests

CommonJS application. Jest, not Vitest. The scaffold's `"type": "module"` and Vitest config are replaced during the foundation phase. Relative imports do not use a `.js` suffix.

Nest's own packages are ESM-only. Node 26 loads them from CommonJS. AWS Lambda is not a target. If a future host disables `require(esm)`, that is a deployment decision and blocks the host, not this ADR.

## Lint and format

The scaffold uses oxlint and Prettier. Keep them. Do not add ESLint beside oxlint unless the CI ADR changes. The engineering criterion asked for ESLint. Oxlint is the linter already wired in this repository and in current Nest CLI output. Switching to ESLint would be a second linter. Record oxlint as the approved stand-in for that criterion.

## Not adopted

Kafka, gRPC, Socket.IO, Sequelize, Mongoose, Docker, Kubernetes, and a CI vendor. `@nestjs/schedule` may only enqueue a BullMQ job if a sweep cannot be expressed as a BullMQ repeatable job. It is not the job system.
