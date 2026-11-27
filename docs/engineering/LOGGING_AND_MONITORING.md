# Logging and monitoring

Use Nest's logger. Each request log line includes the request id that the exception filter already returns as `X-Request-Id`.

Log:

- Method, path, status, and duration at info.
- Job failures at error, with queue name and job id.
- Payment webhook results with the transaction id and status, not the raw body.

Do not log:

- Passwords, tokens, OTP codes, authorization headers, or gateway secrets.
- Full address and phone values at info. Use ids.

No APM vendor is selected. NestJS Observe is available to this scaffold and is not linked. Do not send telemetry until the project owner links it. Metrics for the p95 targets can be taken from request logs until a vendor is approved.

Alerting is unresolved with the host. The operational minimum is that failed BullMQ jobs and 5xx logs are visible to the person running the process.
