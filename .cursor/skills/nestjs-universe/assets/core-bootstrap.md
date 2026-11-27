# Foundation bootstrap

Use this only when creating the CommonJS foundation. Adapt it. Do not copy the ESM scaffold.

- `package.json` has no `"type": "module"`.
- `tsconfig` module is `commonjs`.
- `ConfigModule.forRoot` keeps Joi validation and adds `REDIS_URL` and `JWT_ACCESS_SECRET`.
- `TypeOrmModule.forRoot` sets `synchronize: false` and `autoLoadEntities: true`.
- Global prefix `api/v1`, Helmet, CORS allowlist, `ValidationPipe`, and the existing error-filter envelope extended with localized messages.
- `enableShutdownHooks()` so the process can close Redis and PostgreSQL.

The current `src/main.ts` and `src/app.module.ts` are the starting point for those calls. Remove the `.js` import suffixes when converting to CommonJS.
