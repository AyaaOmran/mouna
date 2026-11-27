# Architecture, Modules, Configuration & Design Patterns

- **Parent skill:** `nestjs-universe`
- **Scope — Included:** Feature module boundaries, one-way DAG, circular dependency removal, `@Global()` and provider scopes, `CoreModule` vs `AppModule`/`CliModule` (`nest-commander`), Joi env validation + `registerAs`, `Symbol` DI tokens + `useFactory`, native ESM imports, pragmatic SOLID guardrails, and `@nestjs/cqrs`.
- **Scope — Excluded:** HTTP validation/filters (`http-and-realtime-apis.md`), ORM entities/migrations (`database-orm-migrations.md`), auth guards (`auth-and-security.md`).
- **Applies to:** `*.module.ts`, `*.service.ts`, `*.config.ts`, `*.command.ts`, `*.handler.ts`, `core.module.ts`, `app.module.ts`, `cli.ts`.

## Contents

1. [Enforce Feature-Based Modules, Single Table Ownership, and Service-Only Exports](#enforce-feature-based-modules-single-table-ownership-and-service-only-exports-critical)
2. [Break Circular Dependencies Architecturally and Avoid @Global or REQUEST Scope](#break-circular-dependencies-architecturally-and-avoid-global-or-request-scope-critical)
3. [Append .js Extensions to Relative Imports in Native ESM](#append-js-extensions-to-relative-imports-in-native-esm-critical)
4. [Split CoreModule Between AppModule and CliModule](#split-coremodule-between-appmodule-and-climodule-high)
5. [Validate Environment Variables at Startup with Joi and Typed registerAs Groups](#validate-environment-variables-at-startup-with-joi-and-typed-registeras-groups-high)
6. [Use Symbol Tokens and useFactory for Interface-Backed Providers](#use-symbol-tokens-and-usefactory-for-interface-backed-providers-high)
7. [Apply SOLID Pragmatically Without Speculative Abstractions](#apply-solid-pragmatically-without-speculative-abstractions-medium)
8. [Use @nestjs/cqrs Only When Read and Write Models Diverge](#use-nestjscqrs-only-when-read-and-write-models-diverge-medium)

---

### Enforce Feature-Based Modules, Single Table Ownership, and Service-Only Exports [CRITICAL]

**Rule:** Organize `src/` by domain feature (`src/jobs/`, `src/applications/`), assign each database table to exactly one owning module, and export **only services** in `@Module({ exports })`. Keep module imports strictly a one-way DAG (`Skills` / `Companies` <- `Jobs` / `Candidates` <- `Applications`).

**Why:** Exporting `TypeOrmModule` or injecting another module's `Repository<T>` bypasses domain invariants (e.g., applying to a closed job) and couples schemas across features, blocking future extraction.

```ts
// ❌ Incorrect — layer folders and leaked repository
@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [JobsService],
  exports: [JobsService, TypeOrmModule], // allows other modules to query Job directly
})
export class JobsModule {}

// ✅ Correct — single owner exports service only
@Module({
  imports: [TypeOrmModule.forFeature([Job]), CompaniesModule, SkillsModule],
  controllers: [JobsController],
  providers: [JobsService, JobsScheduler],
  exports: [JobsService],
})
export class JobsModule {}
```

### Break Circular Dependencies Architecturally and Avoid @Global or REQUEST Scope [CRITICAL]

**Rule:** Never rely on `forwardRef()` as permanent architecture. Break module or service cycles by extracting shared logic into a third module or inverting the dependency with events. Restrict `@Global()` strictly to core infrastructure (`ConfigModule` or a shared `RedisModule`), never feature modules, and keep the default singleton scope instead of `Scope.REQUEST`.

**Why:** Under Node ESM, circular imports crash at module evaluation before NestJS can even report the cycle. Global feature modules hide real dependencies from `imports: []`, and `Scope.REQUEST` bubbles up to every consumer in the DI graph, allocating a fresh object tree on every HTTP request.

```ts
// ❌ Incorrect — masks cycle and triggers per-request DI allocation
@Injectable({ scope: Scope.REQUEST })
export class OrdersService {
  constructor(@Inject(forwardRef(() => BillingService)) private billing: BillingService) {}
}

// ✅ Correct — singleton provider, one-way dependency via shared module or event
@Injectable()
export class OrdersService {
  constructor(private readonly pricing: PricingService, private readonly events: EventEmitter2) {}
  async place(dto: CreateOrderDto) {
    const order = await this.saveOrder(dto, this.pricing.calculate(dto));
    this.events.emit('order.placed', new OrderPlacedEvent(order.id));
    return order;
  }
}
```

**Exception:** `Scope.REQUEST` is acceptable only when a scoped request context (e.g., tenant-bound logger) cannot be passed explicitly or stored in `AsyncLocalStorage`, and its blast radius is audited.

### Append .js Extensions to Relative Imports in Native ESM [CRITICAL]

**Rule:** When `package.json` declares `"type": "module"` and `tsconfig.json` uses `module: "nodenext"`, append `.js` to every relative import path (e.g., `./jobs.service.js`), and use `import type` for type-only references.

**Why:** Node's native ESM resolver does not probe extensionless paths or `.ts` files in `dist/`. Missing `.js` extensions cause `ERR_MODULE_NOT_FOUND` at runtime even when `tsc` compiles cleanly under looser settings.

```ts
// ❌ Incorrect — crashes at runtime under Node ESM
import { JobsService } from './jobs.service';
import { Job } from './job.entity';

// ✅ Correct — NodeNext ESM relative specifier + type-only import
import { JobsService } from './jobs.service.js';
import type { Job } from './job.entity.js';
```

**Exception:** CommonJS projects (no `"type": "module"` in `package.json`) omit `.js` extensions.

### Split CoreModule Between AppModule and CliModule [HIGH]

**Rule:** Extract shared infrastructure (`ConfigModule.forRoot`, `TypeOrmModule.forRootAsync`) into `CoreModule`. Import `CoreModule` in both `AppModule` (which adds HTTP modules and `ScheduleModule.forRoot()`) and `CliModule` (run via `nest-commander` `CommandFactory.run`), keeping CLI commands thin wrappers over existing services.

**Why:** Importing `AppModule` inside a CLI entrypoint starts HTTP controllers, background `@Cron` schedulers, and unused modules during one-off operational commands.

```ts
// ❌ Incorrect — CLI boots HTTP + cron schedulers from AppModule
await CommandFactory.run(AppModule);

// ✅ Correct — CoreModule shared; CliModule loads only JobsModule
@Module({ imports: [CoreModule, JobsModule], providers: [CloseExpiredJobsCommand] })
export class CliModule {}

// src/cli.ts
await CommandFactory.run(CliModule, ['warn', 'error']);
```

### Validate Environment Variables at Startup with Joi and Typed registerAs Groups [HIGH]

**Rule:** Define a `Joi.object(...)` `validationSchema` in `ConfigModule.forRoot({ isGlobal: true, validationSchema, load: [...] })`, group related settings with `registerAs`, and inject them via `@Inject(databaseConfig.KEY)` with `ConfigType<typeof databaseConfig>`. Never read raw `process.env` inside domain services.

**Why:** Missing or malformed environment variables crash immediately at container startup instead of failing mid-request in production, and typed config groups eliminate string-key typos and `string | undefined` casts.

```ts
// ❌ Incorrect — untyped, silent undefined at boot
const url = process.env.DATABASE_URL!;

// ✅ Correct — validated at startup, strongly typed injection
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
});

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
}));
```

### Use Symbol Tokens and useFactory for Interface-Backed Providers [HIGH]

**Rule:** When a service depends on an interchangeable contract (e.g., `Notifier`), export a `Symbol` token alongside the TypeScript interface, bind the concrete implementation via `useFactory` + `inject: [config.KEY]`, and inject it with `@Inject(TOKEN)`.

**Why:** TypeScript interfaces are erased at compile time (`TS2693` if used as a DI token), and string tokens risk accidental collisions or typos across modules.

```ts
// ❌ Incorrect — TS2693: interface does not exist at runtime
constructor(private readonly notifier: Notifier) {}

// ✅ Correct — Symbol token + config-driven factory
export const NOTIFIER = Symbol('NOTIFIER');
export interface Notifier { send(to: string, message: string): Promise<void>; }

@Module({
  providers: [{
    provide: NOTIFIER,
    inject: [notificationsConfig.KEY],
    useFactory: (cfg: ConfigType<typeof notificationsConfig>) =>
      cfg.channel === 'email' ? new EmailNotifier() : new ConsoleNotifier(),
  }],
  exports: [NOTIFIER],
})
export class NotificationsModule {}
```

### Apply SOLID Pragmatically Without Speculative Abstractions [MEDIUM]

**Rule:** Keep `common/` strictly for cross-cutting infrastructure (filters, pipes, decorators), not miscellaneous domain helpers. Start with fewer cohesive modules and split when parts change for unrelated reasons. Never add an interface for every service, a generic `BaseRepository<T>`, or an abstraction with only one implementation "for later".

**Why:** Speculative indirection inflates file count, obscures call graphs, and adds boilerplate without buying real substitutability—NestJS already lets `@nestjs/testing` mock concrete `@Injectable()` classes directly.

```ts
// ❌ Incorrect — 1:1 ceremonial interface + generic base repo
export interface ICandidatesRepository extends BaseRepository<Candidate> {}

// ✅ Correct — concrete @Injectable() service + TypeORM Repository<T>
@Injectable()
export class CandidatesService {
  constructor(@InjectRepository(Candidate) private readonly candidates: Repository<Candidate>) {}
}
```

### Use @nestjs/cqrs Only When Read and Write Models Diverge [MEDIUM]

**Rule:** Adopt `@nestjs/cqrs` (`CqrsModule`, `CommandBus`, `QueryBus`, `EventBus`) when write transactions and complex multi-join read projections need independent optimization or separate read replicas. Enforce zero side effects in every `@QueryHandler`, and return only acknowledgments or IDs from `@CommandHandler`.

**Why:** Separating read and write paths lets heavy reporting queries bypass transactional ORM entities, while guaranteeing queries never mutate state or trigger hidden side effects.

```ts
// ❌ Incorrect — QueryHandler mutates state as a side effect
@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  async execute(q: GetOrdersQuery) {
    await this.auditRepo.insert({ userId: q.userId, viewedAt: new Date() }); // forbidden in query
    return this.ordersRepo.find({ where: { userId: q.userId } });
  }
}

// ✅ Correct — pure QueryHandler; state changes live in CommandHandler + EventBus
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(private readonly repo: OrdersService, private readonly eventBus: EventBus) {}
  async execute(cmd: CreateOrderCommand): Promise<{ id: string }> {
    const order = await this.repo.create(cmd.userId, cmd.items);
    this.eventBus.publish(new OrderCreatedEvent(order.id));
    return { id: order.id };
  }
}
```

| Use `@nestjs/cqrs` | Do NOT Use `@nestjs/cqrs` |
| :--- | :--- |
| Asymmetric read/write load, complex multi-join dashboards, separate read replicas | Simple symmetric CRUD modules where a single service suffices |
| Domain events fan out across multiple bounded contexts | Early-stage products with rapidly changing schemas (indirection slows iteration) |
