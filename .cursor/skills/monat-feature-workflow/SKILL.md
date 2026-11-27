---
name: monat-feature-workflow
description: Required workflow for implementing or changing a MONAT feature. Use when the user asks to build, fix, or continue a feature, endpoint, entity, or business rule in this project.
---

# MONAT feature workflow

Complete these steps in order for the feature you are changing. Do not skip the documentation or the test record.

1. Read the feature file in `docs/features/`.
2. Review the business rules in that file and in `docs/product/BUSINESS_LOGIC.md`. If status changes are involved, read `docs/architecture/STATE_MACHINES.md`.
3. Identify dependencies in `docs/product/FEATURE_CATALOG.md`. Do not start a feature whose dependency is still Not Started.
4. Plan the implementation against the module map, the contract deltas, and the feature's testing and security sections. Stop if a rule is only in `docs/planning/OPEN_QUESTIONS.md`.
5. Implement inside the owning module. Do not add entities, endpoints, or providers that the docs do not contain.
6. Run the tests required by the feature file.
7. Review the diff against `docs/engineering/SECURITY.md` and the feature's acceptance criteria.
8. Update the feature file so it matches the code that exists.
9. Update `docs/planning/IMPLEMENTATION_STATUS.md`. Use Verified only after step 6 passed.
10. Update `docs/planning/IMPLEMENTATION_PROGRESS.md` with the work, the next task, blockers, decisions, and the exact test command plus its result.
11. Record the actual verification result. If tests were not run, say so, and leave the status below Verified.

Also update API docs, database docs, or an ADR when the feature changes those contracts.
