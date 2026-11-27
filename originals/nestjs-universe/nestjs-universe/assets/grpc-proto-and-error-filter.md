# Scaffolding Blueprint: NestJS gRPC (`buf` + `ts-proto`) & Error Filter

> **Optional asset for `nestjs-universe`** — copy and adapt when scaffolding a NestJS `Transport.GRPC` service and HTTP-to-gRPC gateway. Omit `importSuffix=.js` and `.js` extensions in CommonJS projects.

## 1. Contract & Codegen (`proto/todo/v1/todo.proto` & `buf.gen.yaml`)

```protobuf
syntax = "proto3";
package todo.v1;

service TodoService {
  rpc CreateTodo (CreateTodoRequest) returns (Todo);
  rpc GetTodo (GetTodoRequest) returns (Todo);
}
message Todo { string id = 1; string title = 2; bool done = 3; string created_at = 4; }
message CreateTodoRequest { string title = 1; }
message GetTodoRequest { string id = 1; }
```

```yaml
# Run: buf generate ../proto  ->  src/generated/todo/v1/todo.ts
version: v2
plugins:
  - local: ./node_modules/.bin/protoc-gen-ts_proto
    out: src/generated
    opt:
      - nestJs=true
      - importSuffix=.js     # Native ESM (omit for CommonJS)
      - esModuleInterop=true
```

## 2. Shared Loader + gRPC Server (`src/main.ts` & `src/todos/todos.controller.ts`)

```ts
// src/proto.ts — share identical options between server and client
import { resolve } from 'node:path';
export const PROTO_PATH = resolve(import.meta.dirname, '../../proto/todo/v1/todo.proto');
export const LOADER_OPTIONS = { keepCase: false, defaults: true, oneofs: false };

// src/main.ts (gRPC microservice)
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: { package: TODO_V1_PACKAGE_NAME, protoPath: PROTO_PATH, url: '0.0.0.0:50051', loader: LOADER_OPTIONS },
});
await app.listen();

// src/todos/todos.controller.ts (throw RpcException with @grpc/grpc-js status codes)
@Controller()
@TodoServiceControllerMethods()
export class TodosController implements TodoServiceController {
  constructor(private readonly todos: TodosService) {}
  getTodo(req: GetTodoRequest): Todo {
    const todo = this.todos.find(req.id);
    if (!todo) throw new RpcException({ code: status.NOT_FOUND, message: `Todo ${req.id} not found` });
    return todo;
  }
}
```

## 3. HTTP-to-gRPC Client & Status Filter (`src/todos/todos.controller.ts` & `src/common/http-error.filter.ts`)

```ts
// Client controller: register ClientsModule with Transport.GRPC + same LOADER_OPTIONS
@Controller('todos')
export class TodosHttpController implements OnModuleInit {
  private todoService: TodoServiceClient;
  constructor(@Inject('TODO_CLIENT') private readonly client: ClientGrpc) {}
  onModuleInit() { this.todoService = this.client.getService<TodoServiceClient>(TODO_SERVICE_NAME); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Todo> {
    return lastValueFrom(this.todoService.getTodo({ id }).pipe(timeout(2000)));
  }
}

// Global HTTP ExceptionFilter mapping RxJS TimeoutError & gRPC status codes
const GRPC_TO_HTTP: Partial<Record<number, number>> = {
  [GrpcStatus.INVALID_ARGUMENT]: HttpStatus.BAD_REQUEST,
  [GrpcStatus.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [GrpcStatus.ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [GrpcStatus.DEADLINE_EXCEEDED]: HttpStatus.GATEWAY_TIMEOUT,
  [GrpcStatus.UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
};

@Catch()
export class GrpcToHttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const send = (s: number, code: string, message: string) =>
      res.status(s).json({ error: { code, message, details: [] } });

    if (exception instanceof HttpException) {
      return void send(exception.getStatus(), HttpStatus[exception.getStatus()], exception.message);
    }
    if (exception instanceof TimeoutError) {
      return void send(504, 'UPSTREAM_TIMEOUT', 'gRPC upstream timed out');
    }
    if (typeof exception === 'object' && exception !== null && typeof (exception as { code?: unknown }).code === 'number') {
      const err = exception as { code: number; details?: string };
      return void send(GRPC_TO_HTTP[err.code] ?? 500, GrpcStatus[err.code] ?? 'UNKNOWN', err.details ?? 'gRPC error');
    }
    send(500, 'INTERNAL_ERROR', 'Unexpected error');
  }
}
```
