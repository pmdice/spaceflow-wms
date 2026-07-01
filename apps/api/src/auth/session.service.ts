import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@spaceflow/database';
import { env } from '@spaceflow/config-env';

export type SessionUser = { id: string; role: string };

const SESSION_COOKIE_NAME = 'better-auth.session_token';
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

@Injectable()
export class SessionService {
  async validate(cookieHeader: string | undefined): Promise<SessionUser | null> {
    const token = this.extractVerifiedToken(cookieHeader);
    if (!token) return null;

    const session = await db.session.findUnique({ where: { token }, include: { user: true } });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    return { id: session.user.id, role: session.user.role };
  }

  private extractVerifiedToken(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;

    const raw =
      this.readCookie(cookieHeader, SESSION_COOKIE_NAME) ??
      this.readCookie(cookieHeader, SECURE_SESSION_COOKIE_NAME);
    if (!raw) return null;

    return this.verifySignedValue(decodeURIComponent(raw));
  }

  private readCookie(cookieHeader: string, name: string): string | null {
    for (const part of cookieHeader.split('; ')) {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) continue;
      if (part.slice(0, separatorIndex) === name) {
        return part.slice(separatorIndex + 1);
      }
    }
    return null;
  }

  // BetterAuth's session cookie is signed by better-call (the HTTP layer BetterAuth is
  // built on) as `${token}.${base64(HMAC-SHA256(BETTER_AUTH_SECRET, token))}` — found by
  // reading better-call@1.3.2's installed source directly: dist/context.mjs's
  // `getSignedCookie` (signature must be exactly 44 base64 chars, ending in `=`, i.e. a
  // standard-base64-encoded 32-byte SHA-256 digest) and dist/crypto.mjs's `verifySignature`
  // (HMAC-SHA256 over the token string, keyed by the secret). apps/api can't run
  // BetterAuth's own verification code (it's ESM-only — see this task's revision note), so
  // this replicates the same construction directly against the same secret, using
  // `timingSafeEqual` for constant-time comparison rather than a naive `===`.
  private verifySignedValue(value: string): string | null {
    const signatureStartPos = value.lastIndexOf('.');
    if (signatureStartPos < 1) return null;

    const token = value.substring(0, signatureStartPos);
    const signature = value.substring(signatureStartPos + 1);
    if (signature.length !== 44 || !signature.endsWith('=')) return null;

    const expectedSignature = createHmac('sha256', env.BETTER_AUTH_SECRET).update(token).digest('base64');

    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    // Defense-in-depth, not load-bearing: both are always 44 bytes here (the format check
    // above already rejects non-44-char signatures, and SHA-256+base64 always yields 44).
    // timingSafeEqual throws on a length mismatch rather than comparing, so this guard exists
    // to fail closed instead of throwing if that invariant is ever violated.
    if (provided.length !== expected.length) return null;

    return timingSafeEqual(provided, expected) ? token : null;
  }
}
