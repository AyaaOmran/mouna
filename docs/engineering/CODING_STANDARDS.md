# Coding standards

- Native ESM TypeScript. `package.json` must declare `"type": "module"`; TypeScript uses `module` and `moduleResolution` set to `NodeNext`. Relative imports include `.js` extensions, matching emitted files. Do not use `require`, `module.exports`, `__dirname`, or `__filename`; use ESM imports/exports and `import.meta.dirname` or `fileURLToPath(import.meta.url)`. Strict compiler options stay on. Do not set `strictPropertyInitialization` to false for new entity files if a definite assignment or `!` is avoidable.
- Feature folders under `src/modules/<feature>/` with `module`, `controller`, `service`, `dto`, and `entity` files.
- One class per file. Names match the file.
- DTOs are classes. Response DTOs are separate from entities.
- Services throw coded exceptions. Controllers stay thin.
- Transactions use `DataSource.transaction` or a repository manager passed into the method. Do not open a second transaction inside a method that already received a manager.
- No `any` unless a gateway payload is untyped, and then isolate it at the adapter boundary.
- Format with Prettier. Lint with oxlint before a merge.
- Comments explain a constraint that the code cannot show, such as a lock order. Do not comment the concept back into the code.
- Arabic is the only product language. Code, comments, docs, and agent instructions stay English (ADR-017).
- Do not add a repository interface for every entity. TypeORM repositories are the persistence API.
- Shared code goes in `src/common` only when two modules need it. Prefer a feature service export over a generic helper layer.
