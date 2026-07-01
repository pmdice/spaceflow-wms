import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SessionService } from '../src/auth/session.service';
import { db } from '@spaceflow/database';

jest.mock('@spaceflow/database', () => ({
  db: {
    pallet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    palletEvent: { create: jest.fn() },
    $transaction: jest.fn(),
  },
  $Enums: {},
}));

const mockedDb = db as unknown as {
  pallet: { findMany: jest.Mock };
};
const validate = jest.fn();

describe('Pallets API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SessionService)
      .useValue({ validate })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects GET /pallets with no valid session', async () => {
    validate.mockResolvedValue(null);

    await request(app.getHttpServer()).get('/pallets').expect(401);
  });

  it('rejects POST /pallets/:id/actions with no valid session', async () => {
    validate.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/pallets/PAL-00001/actions')
      .send({ action: 'scan' })
      .expect(401);
  });

  it('allows GET /pallets with a valid session and returns persisted pallets', async () => {
    validate.mockResolvedValue({ id: 'user-1', role: 'PICKER' });
    mockedDb.pallet.findMany.mockResolvedValue([
      {
        id: 'PAL-00001',
        destination: 'Zurich',
        status: 'stored',
        urgency: 'low',
        weightKg: 250,
        lastScannedAt: new Date('2026-01-01T00:00:00.000Z'),
        locationId: 'LOC-A-01-01-1',
        zone: 'A',
        aisle: 1,
        bay: 1,
        level: 1,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/pallets')
      .set('Cookie', 'better-auth.session_token=valid-token')
      .expect(200);

    expect(response.body).toEqual([
      {
        id: 'PAL-00001',
        destination: 'Zurich',
        status: 'stored',
        urgency: 'low',
        weightKg: 250,
        lastScannedAt: '2026-01-01T00:00:00.000Z',
        logicalAddress: { id: 'LOC-A-01-01-1', zone: 'A', aisle: 1, bay: 1, level: 1 },
      },
    ]);
  });

  it('still allows GET / without a session (public route)', async () => {
    validate.mockResolvedValue(null);

    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});
