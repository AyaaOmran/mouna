# Jest

- `*.spec.ts` beside the code. E2E in `test/`.
- Use `jest.fn` and `@nestjs/testing`.
- Build the app through the same bootstrap helper the production `main.ts` uses, so pipes and filters match.
- Integration tests call migrations and truncate application tables. They do not use `synchronize: true`.
- A green local unit run does not replace the integration cases named on the feature.
