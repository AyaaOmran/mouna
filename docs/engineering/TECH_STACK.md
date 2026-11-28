# Technology stack

Pins below are the latest stable releases published on the npm registry or vendor release pages on the dates recorded in each row (27–28 November 2026). Implementation must re-check the patch version on the day dependencies are installed and record any newer patch in the progress log. Do not move to a new major without an ADR.

| Component | Version | Source |
|---|---|---|
| Node.js | 26.x Active LTS, not below 26.13.1 | [Node.js 26.13.1](https://nodejs.org/en/blog/release/v26.13.1), 11 November 2026. Active LTS line from the [release schedule](https://github.com/nodejs/Release) |
| PostgreSQL | 19.0 | [Versioning policy](https://www.postgresql.org/support/versioning/), current minor 19.0, released 19 November 2026. 18.7 is the fallback only when the host has no PostgreSQL 19 packages |
| NestJS core, common, platform-express, testing | 12.6.3 | `npm view` on 27 November 2026. Peers: `rxjs` ^7.1.0, `reflect-metadata` ^0.2.0 |
| @nestjs/swagger | 12.1.3 | Peer accepts TypeScript ^5.5 or ^6 and Nest ^12 |
| @nestjs/config | 12.1.1 | npm `latest` |
| @nestjs/typeorm | 12.0.3 | Peer accepts `typeorm` ^0.3.0 or ^1.0.0-dev and Nest 10–12 |
| @nestjs/bullmq | 12.0.2 | Peer accepts `bullmq` 3–6 and Nest 10–12 |
| @nestjs/websockets | 12.6.3 | Socket.IO gateway support; match the Nest 12.6.3 core line |
| @nestjs/platform-socket.io | 12.6.0 | Socket.IO adapter for the approved order-status gateway; re-check its matching patch when installed |
| @nestjs/throttler | 6.8.0 | Peer accepts Nest 12 |
| @nestjs/cli | 12.0.15 | npm `latest`. Generators need Node 22.22.3+, 24.15+, or 26+ |
| TypeORM | 1.1.3 | npm `latest`. Already resolved with `@nestjs/typeorm` 12.0.3 in this repository |
| RxJS | 7.8.2 | npm `latest` on the 7.x line required by Nest |
| TypeScript | 6.0.2 | Already in the scaffold. Swagger's peer accepts ^6.0.0. Do not jump to a newer TypeScript major without checking that peer |
| pg | 8.23.1 | npm `latest` |
| BullMQ | 6.7.10 | npm `latest`, inside the Nest peer range |
| socket.io | 4.8.4 | Order-status monitoring transport; npm `latest` on 28 November 2026 |
| ioredis | 6.1.0 | npm `latest` |
| class-validator | 0.15.1 | npm `latest` |
| class-transformer | 0.5.1 | npm `latest` |
| argon2 | 0.45.2 | npm `latest` |
| Joi | 18.3.2 | Already used by `ConfigModule` in the scaffold |
| Helmet | 8.3.0 | npm `latest` |
| Vitest | 5.1.2 | npm `latest`, checked 28 November 2026 |
| @vitest/coverage-v8 | 5.1.2 | Matches the Vitest runner version; npm `latest`, checked 28 November 2026 |
| supertest | 7.3.2 | npm `latest` |
| reflect-metadata | 0.2.2 | Satisfies the Nest 12 peer and is already in the scaffold |

## Module system and tests

The application is native ESM and uses Vitest. Keep `"type": "module"` in `package.json`; TypeScript must use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. Relative imports include the emitted `.js` extension even when the source file is `.ts` (for example, `import { UsersService } from './users.service.js'`). Do not use CommonJS globals (`require`, `module.exports`, `__dirname`, or `__filename`). Use `import.meta.dirname` on the selected Node 26 runtime, or `fileURLToPath(import.meta.url)` when portable file-path handling is needed.

Vitest is the only test runner. Pin `vitest` and `@vitest/coverage-v8` to the same compatible release line. The version above was the current stable release on 28 November 2026; re-check the compatible patch when installing. Do not install Jest, `ts-jest`, or `@types/jest`. Keep `@nestjs/testing`; it is test-runner agnostic. Keep test APIs explicit (import `describe`, `it`, `expect`, and `vi` from `vitest`) and leave Vitest globals disabled. For E2E tests, use a default Supertest import (`import request from 'supertest'`).

## Lint and format

The scaffold uses oxlint and Prettier. Keep them. Do not add ESLint beside oxlint unless the CI ADR changes. The engineering criterion asked for ESLint. Oxlint is the linter already wired in this repository and in current Nest CLI output. Switching to ESLint would be a second linter. Record oxlint as the approved stand-in for that criterion.

## Not adopted

Kafka, gRPC, Sequelize, Mongoose, Docker, Kubernetes, and a CI vendor. Socket.IO is adopted only for order-status monitoring under ADR-016. `@nestjs/schedule` is not adopted. Every sweep is a BullMQ repeatable job.
