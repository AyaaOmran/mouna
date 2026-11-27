# Foundation bootstrap

Use this only when creating or reviewing the ESM foundation. Keep the repository scaffold's ESM setup; do not convert it to CommonJS.

- `package.json` declares `"type": "module"`.
- TypeScript sets both `module` and `moduleResolution` to `NodeNext`.
- Relative imports use `.js` suffixes, including imports that point to `.ts` source files.
- Do not use `require`, `module.exports`, `__dirname`, or `__filename`. On the selected Node 26 runtime, use `import.meta.dirname` when a filesystem path is needed.
- `ConfigModule.forRoot` keeps Joi validation and adds `REDIS_URL` and `JWT_ACCESS_SECRET`.
- `TypeOrmModule.forRoot` sets `synchronize: false` and `autoLoadEntities: true`.
- Global prefix `api/v1`, Helmet, CORS allowlist, `ValidationPipe`, and the existing error-filter envelope extended with localized messages.
- `enableShutdownHooks()` so the process can close Redis and PostgreSQL.

The current `src/main.ts` and `src/app.module.ts` are the starting point for those calls. Preserve their ESM imports and asynchronous bootstrap pattern.
