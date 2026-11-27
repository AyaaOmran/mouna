# Docker, GitHub Actions CI, and Terminus Health Blueprint

Parent skill: `nestjs-universe`
Use when scaffolding container packaging, CI quality pipelines, and Kubernetes health probes for a NestJS backend. Match Node LTS, PostgreSQL, and GitHub Action major versions to the target repository.

## Multi-Stage Dockerfile (`Dockerfile`)

```dockerfile
FROM node:<lts>-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:<lts>-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]
```

## Docker Ignore (`.dockerignore`)

```text
node_modules
dist
coverage
.git
.env*
```

## GitHub Actions CI (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request: { branches: [main] }
  push: { branches: [main] }

concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }

jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<latest-major>
      - uses: actions/setup-node@<latest-major>
        with: { node-version-file: '.nvmrc', cache: npm }
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint:check
      - run: npm run build
      - run: npm test

  integration:
    needs: checks
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:<major>
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: app_test }
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s
    env:
      DATABASE_URL: postgres://postgres:test@localhost:5432/app_test
    steps:
      - uses: actions/checkout@<latest-major>
      - uses: actions/setup-node@<latest-major>
        with: { node-version-file: '.nvmrc', cache: npm }
      - run: npm ci
      - run: npm run test:int && npm run test:e2e
```

## Terminus Liveness & Readiness (`src/health/health.controller.ts`)

```ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../auth/public.decorator.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get()
  @HealthCheck()
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```
