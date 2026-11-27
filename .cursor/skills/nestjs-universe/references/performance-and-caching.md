# Performance

- Follow `docs/engineering/PERFORMANCE_AND_SCALABILITY.md`.
- Redis is for BullMQ and the throttler.
- Add a cache-aside key only after a measured miss against the p95 targets, and define the invalidation in the same change.
- Select only the columns the response DTO needs.
