
# Mouna

Backend API for Mouna platform.

A platform connecting customers with grandmothers
who prepare homemade meals and traditional pantry products.

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Swagger

## Requirements

- Node.js
- npm
- PostgreSQL

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure your database credentials in `.env`.

Create the PostgreSQL database:

```text
mouna
```

## Run Development Server

```bash
npm run start:dev
```

## API Documentation

```text
http://localhost:3000/api/docs
```


## Project Structure

- src/common: Shared utilities
- src/config: Application configuration
- src/database: Database and migrations
- src/modules: Application features

## Available Scripts

```bash
npm run start:dev
npm run build
npm run lint
npm run test
```
### API Documentation Rules

- `docs/openapi.yaml` is the official API Contract and the source of truth.
- All developers must implement endpoints according to the agreed OpenAPI specification.
- NestJS Swagger decorators must document the actual implementation.
- Do not independently change endpoint paths, HTTP methods, request/response schemas, or status codes.
- Any agreed API contract change must be reflected in both `docs/openapi.yaml` and the NestJS implementation.
- Before merging a Feature PR, verify that its implementation matches the OpenAPI contract.