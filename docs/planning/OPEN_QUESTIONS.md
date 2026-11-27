# Open questions

These items are unresolved. Do not invent values for them during implementation.

| Id | Question | Why it matters | Recommendation | Impact |
|---|---|---|---|---|
| Q1 | Which payment gateway? | Webhook signatures and `gateway_action` differ by vendor. | Keep `PaymentGateway` and a fake adapter until you name the vendor. | Live payments stay unavailable. |
| Q2 | Which SMS provider? | OTP delivery cannot leave the lab without one. | Keep `SmsSender`. Fail closed when unset. | Registration SMS does not send. |
| Q3 | Production file storage? | Images and audio need a durable store. | Local disk only in development. | Production uploads are blocked. |
| Q4 | CI provider and host? | CD, backups, and the real pipeline need a host. | Keep the provider-neutral CI document. Do not adopt the scaffold GitHub Actions file until you say so. | No deploy automation. |
| Q5 | Password minimum length and phone format? | Validation is incomplete. | Require a non-empty password that matches confirmation, and store the phone as verified. Add length and E.164 only after you choose them. | Weak passwords are not additionally rejected. |
| Q6 | Argon2id memory and time cost? | Hash strength depends on the parameters. | Use the current OWASP Password Storage Cheat Sheet figures at implementation and record them in the progress log. | A wrong guess is avoided. |
| Q7 | How is the cooked-food category identified? | Shipping must be rejected for cooked food, and category names are editable. | Add `Category.allows_shipping` only if you approve that column. Until then, do not match on the Arabic name. | The shipping-channel check needs this answer before products are verified. |
| Q8 | Upload size and MIME allow list? | File safety. | Decide the cap and types with the storage vendor. | Upload endpoint stays incomplete for production. |
| Q9 | Dashboard "soon" and "deadline approaching" windows? | Concept section 11.1 uses those words without numbers. | Leave the two lists out of the verified dashboard until you set the windows. Delivery-today and pending-review can be built now. | Dashboard is only partly specified. |
| Q10 | Customer language for jobs? | Expiry and reminder text need a locale. Jobs use the default locale. | Add a user preference column only if you want per-customer job language. | Job messages are Arabic unless the default changes. |
| Q11 | Should delivered-and-refunded lines leave the dues report? | The concept counts delivered goods and does not mention refunds. | Leave refunds in the report until you decide. | Dues can include refunded value. |
| Q13 | Health endpoint? | The endpoint list has no health route. | Probe `GET /settings/public` until you approve a health route. | CD smoke check uses a public settings route. |

The standalone Claude audit report was not supplied. Findings that the OpenAPI file already lists were checked against the concept and the ERD. Items closed by the ADRs are not repeated here.

## Resolved questions

| Id | Decision | Recorded in |
|---|---|---|
| Q12 | Cash on delivery is not marked paid automatically at `delivered`; an admin marks it when cash is collected. | `BUSINESS_LOGIC.md`, ADR-013 |
| Q14 | Reuse `PATCH /admin/orders/{orderId}` with optional `payment_status: paid`, valid only for cash-on-delivery orders. | ADR-013, `swagger.yaml` |
| Q15 | Product holders may read category and season reference lists; writes still require `categories`. | ADR-010, `USER_ROLES_AND_PERMISSIONS.md`, `swagger.yaml` |
