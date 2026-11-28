# Feature change evidence template

Use this compact format as a new entry in [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) for each feature change. Keep only applicable lines; do not copy placeholder text into the log.

```md
## YYYY-MM-DD — <feature>: <short change>

- Authority: `<feature doc section>`; `<business/ADR/API/database/security source>`.
- Scope: <implemented behavior and explicitly excluded work>.
- Contract/schema: <Swagger version/path, migration, or “none”>.
- Verification: `<exact command>` — <passed/failed/not run and why>.
- Remaining: <open question, limitation, or “none”>.
```

Use `Not Started`, `In Progress`, `Blocked`, `Implemented`, and `Verified` only as defined in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). `Verified` requires the required tests to have passed in the current environment.
