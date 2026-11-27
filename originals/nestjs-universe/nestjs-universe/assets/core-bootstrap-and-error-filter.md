# Core Bootstrap, Typed Config & Global Error Filter Blueprint

Optional greenfield scaffolding for NestJS ESM backends (omit `.js` extensions in CommonJS). Copy and adapt when bootstrapping a new service; on existing repositories, preserve the repo's established route prefix and error envelope.

## 1. Joi Env Validation, `registerAs`, and `CoreModule`

```ts
// src/config/env.validation.ts
import Joi from 'joi';
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
});

// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
}));

// src/core.module.ts (shared by AppModule and CliModule)
import { Module } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config.js';
import { envValidationSchema } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres', url: db.url, autoLoadEntities: true, synchronize: false,
      }),
    }),
  ],
})
export class CoreModule {}
```

## 2. Validation Factory & Global `HttpErrorFilter` (`23505` -> `409`)

```ts
// src/common/validation-exception.factory.ts
import { BadRequestException, type ValidationError } from '@nestjs/common';
const toFieldErrors = (errors: ValidationError[], parent = ''): { field: string; message: string }[] =>
  errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints ? [{ field, message: Object.values(e.constraints).join(', ') }] : [];
    return [...own, ...toFieldErrors(e.children ?? [], field)];
  });
export const validationExceptionFactory = (errors: ValidationError[]) =>
  new BadRequestException({ code: 'VALIDATION_FAILED', message: 'Request payload is invalid', details: toFieldErrors(errors) });

// src/common/http-error.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof QueryFailedError && (exception.driverError as { code?: string }).code === '23505') {
      res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'Resource already exists', details: [] } }); return;
    }
    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error', details: [] } }); return;
    }
    const status = exception.getStatus();
    const raw = exception.getResponse();
    const body = typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    res.status(status).json({ error: { code: (body.code as string) ?? HttpStatus[status], message: body.code ? body.message : exception.message, details: (body.details as unknown[]) ?? [] } });
  }
}
```

## 3. Shared `configureApp(app)` & `main.ts`

```ts
// src/configure-app.ts (reused identically by E2E tests)
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from './common/http-error.filter.js';
import { validationExceptionFactory } from './common/validation-exception.factory.js';

export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, exceptionFactory: validationExceptionFactory }));
  app.useGlobalFilters(new HttpErrorFilter());
  app.enableShutdownHooks();
  return app;
}

// src/main.ts
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

const app = await NestFactory.create(AppModule);
configureApp(app);
await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
```
