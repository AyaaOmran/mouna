# Auth & Security

> **Parent skill:** `nestjs-universe`
> **Scope:** NestJS authentication, password hashing, JWT/refresh token lifecycle, RBAC (`@Roles` / `@Permissions`), service-level ownership, and secret hygiene. Excludes OAuth2 provider UI flows and external WAF/TLS termination.
> **Applies to:** NestJS backends (`*.guard.ts`, `*.strategy.ts`, `auth.*`, `permissions.*`, `roles.*`, resource `*.service.ts`).

## Contents

- [Enforce Fail-Closed Global APP_GUARD with @Public()](#enforce-fail-closed-global-app_guard-with-public-critical)
- [Return Identical 401 Errors on Login Failure](#return-identical-401-errors-on-login-failure-critical)
- [Never Accept Privileged Roles or Actor IDs from Request Bodies](#never-accept-privileged-roles-or-actor-ids-from-request-bodies-critical)
- [Issue Short-Lived Access Tokens and Hashed Opaque Refresh Tokens](#issue-short-lived-access-tokens-and-hashed-opaque-refresh-tokens-critical)
- [Verify Refresh Token Expiry and Revocation Before Reissuing](#verify-refresh-token-expiry-and-revocation-before-reissuing-high)
- [Choose Flat @Roles or Granular resource:action @Permissions](#choose-flat-roles-or-granular-resourceaction-permissions-medium)
- [Enforce Service-Level Record Ownership Without ID Existence Oracles](#enforce-service-level-record-ownership-without-id-existence-oracles-critical)
- [Strip Secrets from Every Response and List](#strip-secrets-from-every-response-and-list-critical)

---

### Enforce Fail-Closed Global APP_GUARD with @Public() [CRITICAL]

**Rule:** Register `JwtAuthGuard` (and `PermissionsGuard` when using RBAC) globally via `APP_GUARD` in `AppModule`, and opt out public endpoints with `@Public()`. Always inspect metadata using `reflector.getAllAndOverride(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])` — never `reflector.get()`. In any env-secret guard (e.g., API key check), require `Boolean(expected)` before comparing.

**Why:** Per-controller `@UseGuards(...)` fails open whenever a developer forgets the decorator on a new controller. `reflector.get()` misses class-level metadata. Comparing `req.header('x-api-key') === process.env.API_KEY` without checking `Boolean(expected)` evaluates `undefined === undefined` as `true` when the env var is missing.

```ts
// ❌ Incorrect — opt-in controller guard + reflector.get() + unsafe env check
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {}
const isPublic = this.reflector.get(IS_PUBLIC_KEY, ctx.getHandler());
if (req.header('x-api-key') === process.env.API_KEY) return true; // undefined === undefined

// ✅ Correct — fail-closed APP_GUARD + getAllAndOverride + explicit env guard
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: PermissionsGuard },
]
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  ctx.getHandler(),
  ctx.getClass(),
]);
const expected = this.config.get<string>('API_KEY');
if (!Boolean(expected) || req.header('x-api-key') !== expected) throw new UnauthorizedException();
```

---

### Return Identical 401 Errors on Login Failure [CRITICAL]

**Rule:** Validate password length (`@MinLength(8)`) on registration DTOs, hash with a slow salted password hash (`bcrypt`, cost >= 10), and throw the exact same `401 Unauthorized` status and message (`Invalid email or password`) whether the email does not exist or the password is wrong.

**Why:** Returning `404 Email not registered` vs `401 Wrong password` creates an account enumeration oracle.

```ts
// ❌ Incorrect — distinct errors leak which emails are registered
const user = await this.users.findByEmail(dto.email);
if (!user) throw new NotFoundException('Email not registered');
if (!(await bcrypt.compare(dto.password, user.password))) throw new UnauthorizedException('Wrong password');

// ✅ Correct — uniform 401 for unknown email and wrong password
const user = await this.users.findByEmail(dto.email);
const ok = user ? await bcrypt.compare(dto.password, user.password) : false;
if (!ok) throw new UnauthorizedException('Invalid email or password');
```

---

### Never Accept Privileged Roles or Actor IDs from Request Bodies [CRITICAL]

**Rule:** Omit `role`, `roleId`, and `permissions` from public `RegisterDto` classes (always assign the lowest-privilege role server-side) and enforce email uniqueness across all user/admin tables with `409 Conflict`. Never read `userId`, `studentId`, or `customerId` from request bodies or route params to identify the acting user — derive the actor strictly from the verified JWT (`req.user.sub`).

**Why:** Accepting `role` in `RegisterDto` enables trivial privilege escalation to `admin`. Accepting an actor ID from the request body lets any authenticated user impersonate another account (IDOR).

```ts
// ❌ Incorrect — client chooses role and actor ID
export class RegisterDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() role?: string; // privilege escalation
}
enroll(@Body() dto: { studentId: string; courseId: string }) {
  return this.enrollments.create(dto.studentId, dto.courseId);
}

// ✅ Correct — server-fixed default role + JWT sub actor
export class RegisterDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
} // AuthService hardcodes role = RoleName.STUDENT
enroll(@Req() req: AuthRequest, @Body() dto: CreateEnrollmentDto) {
  return this.enrollments.create(req.user.sub, dto.courseId);
}
```

---

### Issue Short-Lived Access Tokens and Hashed Opaque Refresh Tokens [CRITICAL]

**Rule:** Keep JWT access tokens short-lived (e.g., `15m`) with minimal claims (`sub`, `email`, `role`, `permissions`) and zero secrets. Generate refresh tokens as opaque CSPRNG strings via `randomBytes(32).toString('base64url')`, store only their `SHA-256` hex digest plus bounded expiry in the database, and revoke the stored hash on logout (`204 No Content`, protected by JWT auth).

**Why:** JWTs are base64url-encoded (readable by anyone) and cannot be revoked individually without state. Storing raw refresh tokens in PostgreSQL turns any SQL read/backup leak into full session takeover; skipping revocation on logout leaves stolen tokens valid until expiry.

```ts
// ❌ Incorrect — long-lived JWT, raw refresh token in DB, no-op logout
const accessToken = this.jwt.sign({ sub: user.id, password: user.password }, { expiresIn: '30d' });
await this.tokens.save(user.id, rawRefreshToken);
@Post('logout') logout() { return { ok: true }; } // token still valid

// ✅ Correct — short-lived JWT + CSPRNG SHA-256 hash + 204 revocation
const refreshToken = randomBytes(32).toString('base64url');
const hash = createHash('sha256').update(refreshToken).digest('hex');
await this.tokens.saveHash(user.id, hash, expiresAt);
@HttpCode(204)
@Post('logout')
async logout(@Req() req: AuthRequest): Promise<void> {
  await this.authService.revokeRefreshToken(req.user.sub);
}
```

---

### Verify Refresh Token Expiry and Revocation Before Reissuing [HIGH]

**Rule:** On `POST /auth/refresh`, hash the presented token, verify both the stored hash match and `expiresAt > now`, and clear expired or revoked hashes before rejecting with `401`. Rotate the refresh token on refresh by default unless the API specification mandates access-only refresh.

**Why:** Checking hash existence without expiry or revocation status accepts stale tokens; rotation limits the replay window of a leaked token.

```ts
// ❌ Incorrect — ignores expiry and never rotates
const record = await this.tokens.findByHash(hashRefreshToken(dto.refreshToken));
if (!record) throw new UnauthorizedException();
return { accessToken: this.signAccess(record.user), refreshToken: dto.refreshToken };

// ✅ Correct — checks expiry, clears stale hash, rotates token pair
const record = await this.tokens.findByHash(hashRefreshToken(dto.refreshToken));
if (!record || record.expiresAt.getTime() < Date.now()) {
  if (record) await this.tokens.revoke(record.id);
  throw new UnauthorizedException('Invalid or expired refresh token');
}
return this.issueTokenPair(record.user);
```

---

### Choose Flat @Roles or Granular resource:action @Permissions [MEDIUM]

**Rule:** Select the authorization model matching product complexity; never scatter role-name `if` chains inside controllers.

| Model | Decorator & Check | When to Use | Guard Metadata Rule |
| :--- | :--- | :--- | :--- |
| **Model 1: Flat Roles** | `@Roles('admin')` (`required.includes(user.role)`) | 2–3 fixed roles with stable route access | `reflector.getAllAndOverride(ROLES_KEY, [handler, class])` |
| **Model 2: Role + Permissions** | `@Permissions('course:update')` (`required.every(p => perms.includes(p))`) | Multiple roles, evolving permissions, or DB-managed grants | `reflector.getAllAndOverride(PERMISSIONS_KEY, [handler, class])` |

Verify every controller route's permission constant matches its actual action (e.g., `findAll` requires `TASK_READ`, never copy-pasted `TASK_UPDATE`).

---

### Enforce Service-Level Record Ownership Without ID Existence Oracles [CRITICAL]

**Rule:** Pair RBAC guards with service-level record ownership checks on every read/update/delete of user-scoped resources. Never distinguish missing IDs (`404`) from other users' IDs (`403`) for non-admin callers — throw one uniform status for both (matching the API's contract), while admins receive `404 Not Found` for missing records. Block admins from deleting their own account (`403 Forbidden`).

**Why:** Returning `404` for missing IDs and `403` for other users' IDs gives non-admins an ID existence oracle. Blocking self-deletion prevents accidental lockout of a privileged operator.

```ts
// ❌ Incorrect — skips ownership check and leaks existence via 404 vs 403 split
async findOne(id: string, actor: AuthUser) {
  const row = await this.enrollments.findOneBy({ id });
  if (!row) throw new NotFoundException('Enrollment not found'); // oracle if non-owner gets 403
  if (actor.role !== RoleName.ADMIN && row.studentId !== actor.sub) throw new ForbiddenException();
  return row;
}

// ✅ Correct — uniform status on missing/unowned for non-admins; self-delete blocked
async findOne(id: string, actor: AuthUser) {
  const row = await this.enrollments.findOneBy({ id });
  if (actor.role === RoleName.ADMIN) {
    if (!row) throw new NotFoundException('Enrollment not found');
    return row;
  }
  if (!row || row.studentId !== actor.sub) {
    throw new NotFoundException('Enrollment not found'); // or uniform ForbiddenException if spec requires 403
  }
  return row;
}
async removeAdmin(targetId: string, actor: AuthUser): Promise<void> {
  if (targetId === actor.sub) throw new ForbiddenException('Cannot delete own account');
  const deleted = await this.admins.delete({ id: targetId });
  if (!deleted.affected) throw new NotFoundException('Admin not found');
}
```

---

### Strip Secrets from Every Response and List [CRITICAL]

**Rule:** Never return raw ORM user/admin entities from controllers or nested relations. Map every single-record and list response through an explicit response DTO or serializer that omits `password`, `passwordHash`, `refreshToken`, and `refreshTokenHash` recursively (including nested `student`/`user` objects inside enrollments or orders).

**Why:** ORM queries with `relations: { user: true }` or `findAll()` silently serialize credential columns unless stripped at the query or DTO boundary.

```ts
// ❌ Incorrect — returns raw entity with password & refreshTokenHash
async listUsers() {
  return this.usersRepo.find();
}

// ✅ Correct — explicit projection / response mapper on every item and nested relation
toUserResponse(user: User): UserResponseDto {
  return { id: user.id, email: user.email, name: user.name, role: user.role.name };
}
```
