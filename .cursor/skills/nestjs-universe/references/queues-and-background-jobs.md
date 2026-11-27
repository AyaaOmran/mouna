# BullMQ

- Use `@nestjs/bullmq`. Queues, job ids, attempts, and backoff are fixed in `docs/engineering/BACKGROUND_JOBS.md`.
- Processors extend `WorkerHost` and call the feature service.
- Do not put webhook handling, stock reservation, or delivery-row creation on a queue.
- `@nestjs/schedule` is not the job system. A repeatable BullMQ job covers the sweeps.
- Failed jobs stay in Redis for inspection. Do not add a product endpoint or Bull Board in v1.
