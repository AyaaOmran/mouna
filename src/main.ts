import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import {ValidationPipe,UnprocessableEntityException} from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import type { ValidationError } from 'class-validator';
import { AppModule } from './app.module.js';

function formatValidationErrors(
  errors: ValidationError[],
  parent = '',
): { field: string; code: string; message: string }[] {
  return errors.flatMap((error) => {
    const field = parent
      ? `${parent}.${error.property}`
      : error.property;

    const ownErrors = Object.entries(
      error.constraints ?? {},
    ).map(([constraint, message]) => ({
      field,
      code: constraint.toUpperCase(),
      message,
    }));

    return [
      ...ownErrors,
      ...formatValidationErrors(
        error.children ?? [],
        field,
      ),
    ];
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const corsOrigins =
    configService
      .get<string>('CORS_ORIGIN')
      ?.split(',')
      .map((origin) => origin.trim()) ?? [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },

      exceptionFactory: (errors) => {
        return new UnprocessableEntityException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formatValidationErrors(errors),
        });
      },
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
  );

  // Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mouna API')
    .setDescription('API documentation for Mouna platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
  });

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
