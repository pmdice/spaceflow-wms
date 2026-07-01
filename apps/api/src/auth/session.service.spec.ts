import { createHmac } from 'node:crypto';
import { SessionService } from './session.service';
import { db } from '@spaceflow/database';

jest.mock('@spaceflow/database', () => ({
  db: { session: { findUnique: jest.fn() } },
}));

const SECRET = 'test-secret-at-least-32-characters-long';

jest.mock('@spaceflow/config-env', () => ({
  env: { BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters-long' },
}));

const mockedDb = db as unknown as { session: { findUnique: jest.Mock } };

function signToken(token: string): string {
  const signature = createHmac('sha256', SECRET).update(token).digest('base64');
  return `${token}.${signature}`;
}

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionService();
  });

  it('returns null when there is no cookie header', async () => {
    expect(await service.validate(undefined)).toBeNull();
  });

  it('returns null when the session cookie is missing from the header', async () => {
    expect(await service.validate('other=value')).toBeNull();
  });

  it('returns null when the signature does not match, without touching the database', async () => {
    const tampered = `${signToken('real-token')}x`;

    const user = await service.validate(`better-auth.session_token=${tampered}`);

    expect(user).toBeNull();
    expect(mockedDb.session.findUnique).not.toHaveBeenCalled();
  });

  it('returns null for a well-formed but forged signature', async () => {
    const forged = `some-token.${'A'.repeat(43)}=`;

    expect(await service.validate(`better-auth.session_token=${forged}`)).toBeNull();
  });

  it('looks up the verified token and returns the user when the session is valid', async () => {
    mockedDb.session.findUnique.mockResolvedValue({
      token: 'real-token',
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const user = await service.validate(`better-auth.session_token=${signToken('real-token')}`);

    expect(user).toEqual({ id: 'user-1', role: 'ADMIN' });
    expect(mockedDb.session.findUnique).toHaveBeenCalledWith({
      where: { token: 'real-token' },
      include: { user: true },
    });
  });

  it('returns null when the session has expired', async () => {
    mockedDb.session.findUnique.mockResolvedValue({
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 60_000),
      user: { id: 'user-1', role: 'ADMIN' },
    });

    const user = await service.validate(`better-auth.session_token=${signToken('expired-token')}`);

    expect(user).toBeNull();
  });

  it('returns null when no session row matches the verified token', async () => {
    mockedDb.session.findUnique.mockResolvedValue(null);

    const user = await service.validate(`better-auth.session_token=${signToken('missing-token')}`);

    expect(user).toBeNull();
  });

  it('reads the __Secure- prefixed cookie name as a fallback', async () => {
    mockedDb.session.findUnique.mockResolvedValue({
      token: 'real-token',
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', role: 'PICKER' },
    });

    const user = await service.validate(`__Secure-better-auth.session_token=${signToken('real-token')}`);

    expect(user).toEqual({ id: 'user-1', role: 'PICKER' });
  });
});
