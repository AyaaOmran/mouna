# Authentication and OTP

## 1. Feature overview

Customers register with phone OTP, log in with a password, reset a password, and log out. Admins are created by a Super Admin and use the same login.

## 2. Scope

In: register, verify OTP, login, logout, forgot password, verify reset OTP, reset password, refresh rotation. Out: admin creation (Super Admin feature), profile edits.

## 3. User roles

Guest for register and login. Customer, admin, and super admin for logout and refresh.

## 4. Permissions

No section permission. Role is assigned by the server.

## 5. Business rules

Create the user only after registration OTP succeeds. Hash the OTP and the refresh token. Access token 15 minutes. Refresh token 30 days. OTP is 6 digits, 5 minutes, 5 attempts. Password hashing is Argon2id. Disabled users cannot log in.

Normative detail: [BUSINESS_LOGIC.md](../product/BUSINESS_LOGIC.md) and [STATE_MACHINES.md](../architecture/STATE_MACHINES.md).

## 6. User workflows

Register stores a challenge and enqueues SMS. Verify creates the customer. Login checks the password and returns an access token plus a refresh token. Logout revokes the refresh token.

## 7. Related entities

User, OtpChallenge, RefreshToken.

## 8. Related endpoints

`POST /auth/register`, `/auth/register/verify-otp`, `/auth/login`, `/auth/logout`, `/auth/password/forgot`, `/auth/password/verify-otp`, `/auth/password/reset`.

Paths are listed in [API_ENDPOINTS.md](../api/API_ENDPOINTS.md). Field shapes follow the preserved OpenAPI file plus [API_CONTRACT_DELTAS.md](../api/API_CONTRACT_DELTAS.md).

## 9. Validation

Password must match confirmation. Phone is required and unique. Terms acceptance is required on register. Exact password length and phone format are open questions.

## 10. Security requirements

Throttle OTP and login. No OTP or password in logs or responses. Refresh reuse revokes the user token family. Do not accept a role from the client.

Also apply [SECURITY.md](../engineering/SECURITY.md).

## 11. Performance considerations

Argon2id is CPU heavy. Keep the cost at the OWASP recommendation once confirmed. Do not hash inside a database transaction that holds stock locks. Auth routes do not lock catalog rows.

## 12. Background jobs

`send-otp` on the `otp` queue.

## 13. Edge cases

Second register for an unverified phone replaces the unconsumed challenge. A consumed challenge cannot be reused. Expired OTP increments nothing after expiry and returns `OTP_INVALID`.

## 14. Failure scenarios

SMS provider missing fails the job and does not create a user. The client can call register or forgot-password again. Wrong password returns 401 without revealing whether the phone exists.

## 15. Acceptance criteria

A customer exists only after OTP success. Logout rejects the old refresh token. A sixth OTP attempt fails.

## 16. Testing requirements

Unit: attempt counter and hash compare. Integration: register then verify creates one user. E2E: login and logout. Both locales for `OTP_INVALID`.

Definition of done: [TESTING_STRATEGY.md](../engineering/TESTING_STRATEGY.md).

## 17. Implementation status

Not Started.

## 18. Progress

No implementation work has been done. No tests have been executed.

## 19. Known limitations

SMS vendor is not selected. Resend is not a separate endpoint. Argon2 cost parameters are not pinned.
