# HTTP REST APIs, Validation, Error Handling & Real-Time WebSockets

- **Parent skill:** `nestjs-universe`
- **Scope — Included:** NestJS request lifecycle order, `@Res()` pitfalls, `ValidationPipe`, Query DTO vs `DefaultValuePipe` + `ParseIntPipe` `NaN->0` trap, global `HttpErrorFilter` (`23505` -> `409`), Response DTOs & `@nestjs/mapped-types`, RxJS `NestInterceptor`, contract-first OpenAPI `4xx` schemas, and Socket.IO `@WebSocketGateway` handshake auth.
- **Scope — Excluded:** JWT/RBAC/ownership guards (`auth-and-security.md`), caching/pagination/rate-limiting (`performance-and-caching.md`), gRPC error mapping (`microservices-and-grpc.md`).
- **Applies to:** `*.controller.ts`, `*.dto.ts`, `*.query.ts`, `*.filter.ts`, `*.interceptor.ts`, `*.gateway.ts`, `main.ts`, `openapi.yaml`.

## Contents

1. [Respect the NestJS Request Lifecycle and Avoid Manual @Res() Mode](#respect-the-nestjs-request-lifecycle-and-avoid-manual-res-mode-high)
2. [Configure Global ValidationPipe with Whitelist, ForbidNonWhitelisted, and Transform](#configure-global-validationpipe-with-whitelist-forbidnonwhitelisted-and-transform-critical)
3. [Use Query DTOs Instead of DefaultValuePipe and ParseIntPipe with Global Transform](#use-query-dtos-instead-of-defaultvaluepipe-and-parseintpipe-with-global-transform-critical)
4. [Centralize Error Handling and Map PostgreSQL 23505 to 409](#centralize-error-handling-and-map-postgresql-23505-to-409-critical)
5. [Return Explicit Response DTOs and Derive Update DTOs with Mapped Types](#return-explicit-response-dtos-and-derive-update-dtos-with-mapped-types-critical)
6. [Use RxJS NestInterceptor for Cross-Cutting Timing and Observability](#use-rxjs-nestinterceptor-for-cross-cutting-timing-and-observability-medium)
7. [Author Contract-First OpenAPI Specs Including 4xx Error Schemas](#author-contract-first-openapi-specs-including-4xx-error-schemas-medium)
8. [Authenticate Socket.IO Gateways During the HTTP Upgrade Handshake](#authenticate-socketio-gateways-during-the-http-upgrade-handshake-critical)

---

### Respect the NestJS Request Lifecycle and Avoid Manual @Res() Mode [HIGH]

**Rule:** Place cross-cutting logic at the exact NestJS lifecycle stage: `Middleware -> Guard -> Interceptor (before) -> Pipe -> Handler -> Interceptor (after) -> ExceptionFilter` (scoped `Global -> Controller -> Route`; filters unwind in reverse). Do not inject `@Res()` into standard JSON handlers.

**Why:** Middleware runs before `ExecutionContext` exists (cannot read route metadata) and must call `next()`. Injecting `@Res()` switches a handler into Express manual mode, silently disabling interceptors, `@HttpCode()`, and NestJS response serialization.

```ts
// ❌ Incorrect — @Res() disables interceptors and @HttpCode()
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
  res.status(200).json(this.jobsService.findOne(id));
}

// ✅ Correct — return value lets NestJS run interceptors and serialization
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string): Promise<JobResponse> {
  return this.jobsService.findOne(id).then(toJobResponse);
}
```

**Exception:** Use `@Res({ passthrough: true })` only when setting cookies or custom headers (such as `Location`) while still returning the response body normally.

### Configure Global ValidationPipe with Whitelist, ForbidNonWhitelisted, and Transform [CRITICAL]

**Rule:** Register one global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in your shared `configureApp(app)` bootstrap and validate every body/query with `class-validator` DTO classes. Add a custom `exceptionFactory` only when matching a structured error envelope used by the repository.

**Why:** Without `whitelist` and `forbidNonWhitelisted`, clients can inject unexpected fields (mass assignment, such as `role: 'admin'` or `status: 'approved'`).

```ts
// ❌ Incorrect — accepts arbitrary extra properties
app.useGlobalPipes(new ValidationPipe());

// ✅ Correct — strips and rejects unknown fields globally
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Use Query DTOs Instead of DefaultValuePipe and ParseIntPipe with Global Transform [CRITICAL]

**Rule:** Use built-in pipes (`ParseUUIDPipe`, `ParseEnumPipe`) for single path parameters, and use a class-based Query DTO (`@Query() query: ListApplicationsQuery`) with `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(0)`, and a default field value for multi-parameter or numeric query strings.

**Why:** With global `transform: true` enabled, `@Query('minScore', new DefaultValuePipe(0), ParseIntPipe)` transforms `?minScore=abc` into `NaN` first; `DefaultValuePipe(0)` treats `NaN` as missing and silently replaces it with `0`, returning unfiltered data instead of `400`.

```ts
// ❌ Incorrect — ?minScore=abc becomes NaN -> 0 with global transform: true
@Get('jobs/:jobId/applications')
list(
  @Param('jobId', ParseUUIDPipe) jobId: string,
  @Query('minScore', new DefaultValuePipe(0), ParseIntPipe) minScore: number,
) { /* silently runs with minScore = 0 */ }

// ✅ Correct — Query DTO returns 400 on ?minScore=abc and defaults to 0 when omitted
export class ListApplicationsQuery {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minScore: number = 0;
}
```

### Centralize Error Handling and Map PostgreSQL 23505 to 409 [CRITICAL]

**Rule:** Register a global `@Catch()` `HttpErrorFilter` that follows the repository's error envelope, logs unexpected exceptions server-side while returning a generic `500` response, and maps PostgreSQL unique violations (`QueryFailedError` with `driverError.code === '23505'`) to `409 Conflict`.

**Why:** Application-level "check then insert" races fail under concurrent requests; letting the database unique constraint arbitrate and translating `23505` centrally prevents unhandled `500`s and stops SQL/stack traces from leaking to clients.

```ts
// ❌ Incorrect — leaks raw error / returns 500 on concurrent duplicate insert
catch(err: unknown, host: ArgumentsHost) {
  host.switchToHttp().getResponse().status(500).json({ message: String(err) });
}

// ✅ Correct — maps PG 23505 -> 409 and hides unknown internal errors
if (
  exception instanceof QueryFailedError &&
  (exception.driverError as { code?: string }).code === '23505'
) {
  res.status(409).json({
    error: { code: 'ALREADY_EXISTS', message: 'Resource already exists', details: [] },
  });
  return;
}
```

### Return Explicit Response DTOs and Derive Update DTOs with Mapped Types [CRITICAL]

**Rule:** Never return raw TypeORM or Sequelize entities from controller methods. Map entities through an explicit Response DTO serializer (converting `Date` fields with `.toISOString()`). Build partial update DTOs with `@nestjs/mapped-types` (`PartialType(OmitType(...))`) to exclude immutable foreign keys or ownership fields.

**Why:** Returning raw entities couples API contracts to schema changes and silently leaks sensitive columns (`passwordHash`, `refreshTokenHash`, internal join graphs). Hand-duplicating update DTOs drifts from creation validators or exposes immutable IDs.

```ts
// ❌ Incorrect — returns raw entity with nested graphs and allows companyId mutation
@Patch(':id')
update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateJobDto): Promise<Job> {
  return this.jobsService.update(id, dto);
}

// ✅ Correct — explicit Response DTO mapper + PartialType(OmitType(...))
export class UpdateJobDto extends PartialType(
  OmitType(CreateJobDto, ['companyId'] as const),
) {}

export function toApplicationResponse(a: Application): ApplicationResponse {
  return {
    id: a.id, candidateId: a.candidate.id, jobId: a.job.id,
    status: a.status, score: a.score, appliedAt: a.appliedAt.toISOString(),
  };
}
```

### Use RxJS NestInterceptor for Cross-Cutting Timing and Observability [MEDIUM]

**Rule:** Use `NestInterceptor` with RxJS `finalize()` for latency/observability logging (so both success and error paths are measured), and reserve `tap()` / `map()` for success-only inspection or uniform response shaping; keep domain mutations and authorization out of interceptors.

**Why:** `tap()` alone skips failed/thrown requests and skews latency metrics; `finalize()` runs unconditionally around `next.handle()` without polluting controller methods.

```ts
// ❌ Incorrect — duplicated boilerplate in handlers or tap() missing failed requests
@Get()
async findAll() {
  const t = Date.now(); const data = await this.jobsService.findAll();
  this.logger.log(`GET /jobs ${Date.now() - t}ms`); return data;
}

// ✅ Correct — cross-cutting NestInterceptor with RxJS finalize()
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const started = Date.now();
    return next.handle().pipe(
      finalize(() => this.logger.log(`${req.method} ${req.url} ${Date.now() - started}ms`)),
    );
  }
}
```

### Author Contract-First OpenAPI Specs Including 4xx Error Schemas [MEDIUM]

**Rule:** Design OpenAPI 3 `paths` and `components/schemas` before coding endpoints, lint with `@redocly/cli lint`, and explicitly declare `400`, `401`, `403`, `404`, and `409` responses referencing the canonical `ErrorEnvelope` schema alongside `2xx` responses.

**Why:** Happy-path-only specs leave frontend/mobile clients guessing error shapes and break contract-driven integration tests.

```yaml
# ❌ Incorrect — happy-path-only contract omits validation and conflict shapes
responses:
  '201': { description: Application created }

# ✅ Correct — documents 201 + Location and shared ErrorEnvelope for 4xx
responses:
  '201':
    description: Application created
    headers: { Location: { schema: { type: string } } }
  '400': { $ref: '#/components/responses/ValidationError' }
  '409': { $ref: '#/components/responses/ConflictError' }
```

### Authenticate Socket.IO Gateways During the HTTP Upgrade Handshake [CRITICAL]

**Rule:** Implement real-time channels with `@WebSocketGateway()` (`OnGatewayConnection`, `OnGatewayDisconnect`, `@WebSocketServer()`, `@SubscribeMessage()`), using **namespaces** (`/admin`, `/user`) for isolated channels and **rooms** (`dashboard`, `user-${id}`) for scoped broadcasts. Authenticate every socket with a JWT Guard or handshake verifier during the HTTP upgrade handshake — never via query string tokens, post-connect first messages, or cookies.

**Why:** Query-string tokens leak into proxy/server access logs; first-message auth leaves an unauthenticated connection open; cookies fail reliably on mobile/cross-origin clients. Handshake verification rejects unauthorized callers before the socket opens.

```ts
// ❌ Incorrect — token in query string leaks in URL/proxy logs
handleConnection(client: Socket) {
  const token = client.handshake.query.token as string; // leaked in access logs
  this.jwtService.verify(token);
}

// ✅ Correct — verify JWT from Authorization / handshake auth before admitting client
@WebSocketGateway({ namespace: '/dashboard' })
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.slice(7);
    try {
      const payload = await this.jwt.verifyAsync(token);
      client.data.user = payload;
      await client.join(`user-${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }
  handleDisconnect(client: Socket) { /* emit presence update */ }
}
```

| Use WebSockets (Socket.IO) | Do NOT Use WebSockets |
| :--- | :--- |
| Live dashboards, real-time alerts, chat, multiplayer, live trading feeds | Rarely changing data, pure request-response APIs, simple CRUD apps (persistent sockets carry memory and sticky-session infra cost) |
