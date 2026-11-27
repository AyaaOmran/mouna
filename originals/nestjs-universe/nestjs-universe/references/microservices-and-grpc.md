# Microservices, Resilience & gRPC (NestJS)

> **Parent skill:** `nestjs-universe`
> **Scope:** Modular-monolith-first & Strangler Fig extraction, DB-per-service & local snapshots, local-checks-first ordering, API gateway security/correlation rules, nested timeouts, retry + backoff + jitter inside a 3-state circuit breaker, `Idempotency-Key` writes, sagas over 2PC, and NestJS gRPC (`buf` + `ts-proto` + `Transport.GRPC` + `RpcException` + HTTP error filter). Excludes event-broker streaming (Kafka) and single-app BullMQ jobs.
> **Applies to:** `*.client.ts`, `*.filter.ts`, `*.controller.ts`, `*.service.ts`, `*.proto`, `buf.gen.yaml`, `main.ts` using `@nestjs/microservices`, `@grpc/grpc-js`, `@grpc/proto-loader`, `ts-proto`, `opossum`.

## Contents

- [Start with a Modular Monolith & Extract via Strangler Fig](#start-with-a-modular-monolith--extract-via-strangler-fig-medium)
- [Enforce DB-per-Service & Store Local Snapshots for Lists](#enforce-db-per-service--store-local-snapshots-for-lists-critical)
- [Validate Local State Before Making Network Calls](#validate-local-state-before-making-network-calls-high)
- [Sanitize Gateway Identity Headers & Propagate `X-Correlation-Id`](#sanitize-gateway-identity-headers--propagate-x-correlation-id-critical)
- [Nest Timeout Budgets Inside Outer Callers](#nest-timeout-budgets-inside-outer-callers-high)
- [Retry Only Transient Failures with Backoff + Jitter Inside a Circuit Breaker](#retry-only-transient-failures-with-backoff--jitter-inside-a-circuit-breaker-critical)
- [Protect Retried Writes with `Idempotency-Key` & Use Sagas Over 2PC](#protect-retried-writes-with-idempotency-key--use-sagas-over-2pc-high)
- [Generate Typed NestJS gRPC Contracts with `buf` + `ts-proto`](#generate-typed-nestjs-grpc-contracts-with-buf--ts-proto-high)
- [Throw `RpcException` in gRPC Servers & Map gRPC Statuses in HTTP Gateways](#throw-rpcexception-in-grpc-servers--map-grpc-statuses-in-http-gateways-critical)

---

### Start with a Modular Monolith & Extract via Strangler Fig [MEDIUM]

- **Rule:** Default to a modular monolith unless independent team boundaries, distinct scaling profiles, and operational maturity justify network latency and distributed failures. Split strictly by **business capability** (`identity`, `applications`, `notifications`), never by technical layer (e.g., "validation service"). Extract one path prefix at a time behind an API gateway (**Strangler Fig**).
- **Why:** Splitting early or sharing databases/deployments produces a **distributed monolith** — all network and ops costs with zero independent deployability.

| Decision Signal | Modular Monolith | Microservices |
| :--- | :--- | :--- |
| Team & boundaries | Small team or shifting domain lines | Multiple teams blocking releases; stable seams |
| Cross-feature calls | In-process function call + local SQL tx | Network call (timeouts, retries, sagas) |
| Extraction path | Default starting point | Route one prefix at a time via gateway |

---

### Enforce DB-per-Service & Store Local Snapshots for Lists [CRITICAL]

- **Rule:** NEVER query another service's database tables or add cross-service foreign keys. Store only plain UUID references (`candidateId`) and copy read-mostly display fields (`candidateName`, `candidateEmail`) at write time so list endpoints query only the local database.
- **Why:** Direct cross-DB SQL couples schemas and destroys independent deploys. Calling `identity-service` per row inside `listApplications()` creates cross-service N+1 fan-out that collapses under load.

```ts
// ❌ Incorrect: cross-service N+1 read on list endpoint (or direct SQL to identity_db)
const apps = await this.applications.find({ where: { jobId } });
return Promise.all(apps.map(async (a) => ({ ...a, candidate: await this.identity.getCandidate(a.candidateId) })));

// ✅ Correct: snapshot copied at apply() time -> list endpoint is a single local query
const application = this.applications.create({
  jobId, candidateId: candidate.id, candidateName: candidate.name, candidateEmail: candidate.email,
});
return this.applications.find({ where: { jobId }, order: { score: 'DESC' } });
```

---

### Validate Local State Before Making Network Calls [HIGH]

- **Rule:** Always check local preconditions (`job.status === 'open'`, duplicate application check, ownership) before invoking any remote service.
- **Why:** Remote RPCs are orders of magnitude slower and more failure-prone than local DB reads; rejecting invalid requests locally saves latency, avoids unnecessary downstream load, and keeps endpoints working during dependency degradation.

```ts
// ❌ Incorrect: fetches remote candidate profile before checking if job is closed
const candidate = await this.identity.getCandidate(user.id, user.correlationId);
const job = await this.findJob(jobId);
if (job.status !== 'open') throw new ConflictException({ code: 'JOB_CLOSED', message: 'Job is closed' });

// ✅ Correct: reject invalid local state before touching the network
const job = await this.findJob(jobId);
if (job.status !== 'open') throw new ConflictException({ code: 'JOB_CLOSED', message: 'Job is closed' });
if (await this.applications.existsBy({ jobId, candidateId: user.id })) {
  throw new ConflictException({ code: 'ALREADY_APPLIED', message: 'Already applied' });
}
const candidate = await this.identity.getCandidate(user.id, user.correlationId);
```

---

### Sanitize Gateway Identity Headers & Propagate `X-Correlation-Id` [CRITICAL]

- **Rule:** At the API gateway, **strip all incoming client `X-User-*` headers** (`X-User-Id`, `X-User-Role`, `X-User-Email`) before authenticating and re-injecting verified identity. Never expose `/internal/*` routes publicly, keep domain business logic out of the gateway, and generate/forward `X-Correlation-Id` across every downstream call and log line.
- **Why:** If the gateway trusts or forgets to delete client-supplied `X-User-Role: admin`, any caller can forge elevated privileges on private downstream services. Missing correlation IDs make multi-service debugging impossible.

```ts
// ❌ Incorrect: forwards raw request headers without stripping spoofed identity
proxyReq.setHeader('x-correlation-id', req.header('x-correlation-id') ?? randomUUID());

// ✅ Correct: strip untrusted client identity headers first, then set verified values
delete req.headers['x-user-id'];
delete req.headers['x-user-role'];
delete req.headers['x-user-email'];
const cid = req.header('x-correlation-id') ?? randomUUID();
req.headers['x-correlation-id'] = cid;
const verified = await this.verifyToken(req.header('authorization'), cid);
req.headers['x-user-id'] = verified.id;
req.headers['x-user-role'] = verified.role;
```

---

### Nest Timeout Budgets Inside Outer Callers [HIGH]

- **Rule:** Put an explicit timeout on every outbound network call (`AbortSignal.timeout(ms)` for `fetch`, RxJS `timeout(ms)` for gRPC). Size inner timeouts so `attempts * perAttemptTimeout + maxBackoff` fits strictly inside the outer caller's timeout (e.g., gateway `5000 ms` > service retry budget `3 * 1000 ms + 600 ms`).
- **Why:** Unbounded calls leak sockets until the service hangs. If inner retries exceed the outer gateway timeout, the gateway already returned `502`/`504` while the downstream service keeps burning CPU/DB writes.

```ts
// ❌ Incorrect: unbounded fetch hangs caller indefinitely when dependency stalls
const res = await fetch(`${this.baseUrl}/internal/users/${id}`);

// ✅ Correct: explicit per-attempt timeout sized inside outer 5s gateway budget
const res = await fetch(`${this.baseUrl}/internal/users/${id}`, {
  headers: { 'x-correlation-id': cid },
  signal: AbortSignal.timeout(1000),
});
```

---

### Retry Only Transient Failures with Backoff + Jitter Inside a Circuit Breaker [CRITICAL]

- **Rule:** Retry **only** timeouts, connection errors, and `5xx` responses — NEVER `4xx` (`400`, `401`, `403`, `404`). Space retries with exponential backoff + random jitter (`200 * 2 ** (attempt - 1) + rand(0..100)`), and wrap the retry loop **inside** a 3-state circuit breaker (`CLOSED` -> `OPEN` after N failures -> `HALF_OPEN` trial after cooldown; use `opossum` in production).
- **Why:** Retrying a `404` wastes capacity on a permanent answer. Retrying without jitter causes synchronized retry storms. Wrapping retries inside a circuit breaker prevents every incoming request from waiting full retry budgets against a dead dependency.

```ts
// ❌ Incorrect: retries 404 immediately with no jitter and no circuit breaker
if (!res.ok) throw new RetryableError(`status ${res.status}`); // retries 404!

// ✅ Correct: 404 fails fast; only 5xx/network retries inside CircuitBreaker
return this.breaker.call(() => this.withRetry(async () => {
  const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
  if (res.status === 404) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', message: 'Not found' });
  if (res.status >= 500) throw new RetryableError(`status ${res.status}`);
  return res.json();
}));
```

---

### Protect Retried Writes with `Idempotency-Key` & Use Sagas Over 2PC [HIGH]

- **Rule:** Accept an `Idempotency-Key` header on retried `POST` mutations, store it with a unique DB constraint, and return the existing record on repeat calls instead of inserting twice or throwing a confusing `409`. For multi-service workflows spanning separate databases, use an orchestrated or choreographed **Saga** with compensating actions — never distributed two-phase commit (2PC).
- **Why:** A client timeout does not mean the write failed — the server may have committed after the caller disconnected. 2PC holds cross-service locks and blocks on coordinator failure.

```ts
// ❌ Incorrect: client retries after timeout -> duplicate row or confusing 409 ALREADY_APPLIED
return this.applications.save(this.applications.create({ jobId, candidateId: user.id }));

// ✅ Correct: idempotency lookup on retried writes + saga compensation on cross-service failure
if (idempotencyKey) {
  const existing = await this.applications.findOneBy({ idempotencyKey, candidateId: user.id });
  if (existing) return existing;
}
// Saga orchestration: if step 2 (remote markEmployed) fails, run local compensating action
try {
  await this.applications.update(appId, { status: 'hired' });
  await this.identity.markEmployed(candidateId, cid);
} catch (err) {
  await this.applications.update(appId, { status: 'shortlisted' }); // compensate step 1
  throw err;
}
```

---

### Generate Typed NestJS gRPC Contracts with `buf` + `ts-proto` [HIGH]

- **Rule:** Define service contracts in versioned `.proto` files (`package todo.v1;`) and generate TypeScript interfaces/decorators with `@bufbuild/buf` + `ts-proto` (`nestJs=true`, `esModuleInterop=true`, and `importSuffix=.js` for **Native ESM**; omit `importSuffix=.js` and `.js` relative import extensions on **CommonJS**). Share identical `LOADER_OPTIONS` (`{ keepCase: false, defaults: true, oneofs: false }`) between `createMicroservice(Transport.GRPC)` and `ClientsModule.register(Transport.GRPC)`. Decorate server controllers with `@<Service>ControllerMethods()` and `implements <Service>Controller`; resolve the generated client inside `onModuleInit()` via `client.getService<TodoServiceClient>(TODO_SERVICE_NAME)`.
- **Why:** Manual `@GrpcMethod` strings drift silently from `.proto` contracts; mismatched `keepCase`/`defaults` loader options drop camelCase fields at runtime; omitting `importSuffix=.js` breaks Node ESM resolution.

```ts
// ❌ Incorrect: hand-written @GrpcMethod strings drift from proto; missing ESM .js suffix
@GrpcMethod('TodoService', 'GetTodos') // typo silently breaks RPC routing

// ✅ Correct: generated decorator + interface on server; typed ClientGrpc handle on client
@Controller()
@TodoServiceControllerMethods()
export class TodosController implements TodoServiceController {
  getTodo(request: GetTodoRequest): Todo { return this.todos.get(request.id); }
}
// HTTP gateway client (onModuleInit):
this.todoService = this.client.getService<TodoServiceClient>(TODO_SERVICE_NAME);
const todo = await lastValueFrom(this.todoService.getTodo({ id }).pipe(timeout(2000)));
```

---

### Throw `RpcException` in gRPC Servers & Map gRPC Statuses in HTTP Gateways [CRITICAL]

- **Rule:** In gRPC microservices, throw `RpcException({ code: status.NOT_FOUND, message })` using `@grpc/grpc-js` `status` codes — NEVER HTTP exceptions (`NotFoundException`). In HTTP-to-gRPC gateways, await every `Observable` call via `lastValueFrom(obs.pipe(timeout(2000)))` and register a global `ExceptionFilter` mapping RxJS `TimeoutError` / `DEADLINE_EXCEEDED` -> `504`, `INVALID_ARGUMENT` -> `400`, `NOT_FOUND` -> `404`, `ALREADY_EXISTS` -> `409`, and `UNAVAILABLE` -> `503`.
- **Why:** NestJS gRPC serializes `HttpException` as opaque `UNKNOWN` (`code: 2`), leaking `500` errors to HTTP clients; unpiped gRPC `Observable`s have no client-side deadline.

```ts
// ❌ Incorrect: HTTP exception inside gRPC server + unmapped gRPC error returning 500
throw new NotFoundException(`Todo ${id} not found`); // gRPC client receives code 2 UNKNOWN

// ✅ Correct: RpcException in gRPC service + explicit status map in HTTP gateway filter
// gRPC server:
throw new RpcException({ code: status.NOT_FOUND, message: `Todo ${id} was not found` });
// HTTP gateway filter:
const GRPC_TO_HTTP: Partial<Record<number, number>> = {
  [GrpcStatus.INVALID_ARGUMENT]: 400, [GrpcStatus.NOT_FOUND]: 404,
  [GrpcStatus.ALREADY_EXISTS]: 409, [GrpcStatus.DEADLINE_EXCEEDED]: 504, [GrpcStatus.UNAVAILABLE]: 503,
};
```
