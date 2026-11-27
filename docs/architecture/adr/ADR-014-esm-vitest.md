# ADR-014: Native ESM and Vitest

**Status:** Accepted, 28 November 2026.

The application uses native ESM and Vitest. `package.json` declares `"type": "module"`; TypeScript uses `NodeNext` for both `module` and `moduleResolution`. Relative source imports include the emitted `.js` suffix. CommonJS globals are not used except for a documented interop boundary. Vitest is the sole runner, with explicit imports from `vitest`; Jest, ts-jest, and @types/jest are not installed. Use a matching `@vitest/coverage-v8` release. `@nestjs/testing` remains in use.

This decision supersedes the module-format and test-runner choice in ADR-001. The modular-monolith shape, TypeORM, PostgreSQL, Redis, and BullMQ decisions remain unchanged.
