# Account profile

## 1. Feature overview

A signed-in user reads and updates first and last name, changes phone with OTP, and changes password.

## 2. Scope

In: `/me`, phone change, password change. Out: addresses, notifications.

## 3. User roles

Customer, admin, and super admin for their own row.

## 4. Permissions

Ownership of the token subject. No admin section.

## 5. Business rules

Phone change writes `new_phone` on an OTP challenge and updates `User.phone` only after verification. Password change checks the current password.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

GET profile. PATCH name. POST phone change, then verify. PUT password.

## 7. Related entities

User, OtpChallenge.

## 8. Related endpoints

`GET /me`, `PATCH /me`, `POST /me/phone/change-request`, `POST /me/phone/verify-otp`, `PUT /me/password`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow [swagger.yaml](../api/swagger.yaml).

## 9. Validation

Names required on patch when present. New phone must be unique. New password must match confirmation.

## 10. Security requirements

404 is not used for `/me`. 401 when unauthenticated. Do not return `password_hash`.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Single-row reads by primary key.

## 12. Background jobs

OTP SMS for phone change.

## 13. Edge cases

Changing the phone to the current value is a 409. An admin uses the same endpoints for their own profile.

## 14. Failure scenarios

Failed OTP leaves the old phone in place.

## 15. Acceptance criteria

Name changes persist. Phone changes only after OTP. Password login uses the new password.

## 16. Testing requirements

Integration: phone change does not update the user before verify. Arabic validation messages.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

No avatar. No email. No stored language preference for background jobs.
