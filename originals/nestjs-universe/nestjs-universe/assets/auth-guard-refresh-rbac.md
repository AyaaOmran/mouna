# Auth Guard, Refresh Token & RBAC Blueprint (ESM)

> Optional scaffolding reference for `nestjs-universe`. Hardened global `APP_GUARD` + `@Public()`, `resource:action` `PermissionsGuard`, and opaque SHA-256 refresh tokens with `/auth/logout` revocation (`204`).

## 1. `@Public()` & Global `JwtAuthGuard`

```ts
// src/auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// src/auth/jwt-auth.guard.ts
import { type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }

  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    return isPublic ? true : super.canActivate(ctx);
  }
}
```

## 2. Granular `resource:action` `PermissionsGuard`

```ts
// src/permissions/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// src/permissions/permissions.guard.ts
import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const perms: string[] = ctx.switchToHttp().getRequest().user?.permissions ?? [];
    if (!required.every((p) => perms.includes(p))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
```

## 3. Opaque SHA-256 Refresh Token Helper & Logout Revocation

```ts
// src/auth/refresh-token.util.ts
import { createHash, randomBytes } from 'node:crypto';
export const generateRefreshToken = (): string => randomBytes(32).toString('base64url');
export const hashRefreshToken = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');

// src/auth/auth.controller.ts (JWT-protected logout; @Public() on register/login/refresh)
@HttpCode(204)
@Post('logout')
async logout(@Req() req: { user: { sub: string } }): Promise<void> {
  await this.authService.revokeRefreshToken(req.user.sub);
}
```

## 4. `APP_GUARD` Wiring

```ts
// src/app.module.ts — fail-closed global guard order (JwtAuthGuard MUST run first)
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: PermissionsGuard },
]
```
