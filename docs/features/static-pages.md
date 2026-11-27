# Static pages

## 1. Feature overview

About, contact, terms, privacy, cancellation policy, and FAQ are frontend content edited in code.

## 2. Scope

In: nothing on the backend. Out: a CMS.

## 3. User roles

None.

## 4. Permissions

None.

## 5. Business rules

Concept section 3.10. There is no API.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

None.

## 7. Related entities

None.

## 8. Related endpoints

None. Do not add `/pages`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Not applicable.

## 10. Security requirements

Not applicable.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Not applicable.

## 12. Background jobs

None.

## 13. Edge cases

The disabled cancel button tells the customer to use the contact page. The API returns the reason code. It does not embed a CMS body.

## 14. Failure scenarios

Not applicable.

## 15. Acceptance criteria

No page table exists.

## 16. Testing requirements

No HTTP route is registered for static pages.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

Legal text is not served by this API.
