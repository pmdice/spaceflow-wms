import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PalletsService } from './pallets.service';
import { db } from '@spaceflow/database';

jest.mock('@spaceflow/database', () => ({
  db: {
    pallet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    palletEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
  $Enums: {},
}));

type UpdateArgs = { where: { id: string }; data: Record<string, unknown> };

const mockedDb = db as unknown as {
  pallet: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock<Promise<Record<string, unknown>>, [UpdateArgs]>;
  };
  palletEvent: { create: jest.Mock };
  $transaction: jest.Mock;
};

function makePallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PalletsService', () => {
  let service: PalletsService;

  beforeEach(() => {
    service = new PalletsService();
    jest.clearAllMocks();
    mockedDb.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
  });

  describe('findAll', () => {
    it('maps database rows to SpatialPallet shape', async () => {
      mockedDb.pallet.findMany.mockResolvedValue([makePallet()]);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 'PAL-00001',
          destination: 'Zurich',
          status: 'stored',
          urgency: 'low',
          weightKg: 250,
          lastScannedAt: '2026-01-01T00:00:00.000Z',
          logicalAddress: {
            id: 'LOC-A-01-01-1',
            zone: 'A',
            aisle: 1,
            bay: 1,
            level: 1,
          },
        },
      ]);
    });
  });

  describe('applyAction', () => {
    it('throws BadRequestException when the action is invalid, before touching the database', async () => {
      await expect(
        service.applyAction('PAL-00001', { action: 'fly' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockedDb.pallet.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the pallet does not exist', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(null);

      await expect(
        service.applyAction('PAL-MISSING', { action: 'scan' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets status to stored for putaway', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(
        makePallet({ status: 'delayed' }),
      );
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'putaway',
      });

      expect(pallet.status).toBe('stored');
      expect(mockedDb.pallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'PAL-00001' },
          data: expect.objectContaining({ status: 'stored' }) as Record<
            string,
            unknown
          >,
        }),
      );
    });

    it('sets status to transit for pick and load', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(
        makePallet({ status: 'stored' }),
      );
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'pick',
      });

      expect(pallet.status).toBe('transit');
    });

    it('sets status to delayed and urgency to high for delay', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(
        makePallet({ status: 'stored', urgency: 'low' }),
      );
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'delay',
      });

      expect(pallet.status).toBe('delayed');
      expect(pallet.urgency).toBe('high');
    });

    it('relocates to the next free slot in the target zone, skipping already-occupied slots', async () => {
      const moving = makePallet({
        id: 'PAL-00001',
        zone: 'A',
        aisle: 1,
        bay: 1,
        level: 1,
      });
      mockedDb.pallet.findUnique.mockResolvedValue(moving);
      mockedDb.pallet.findMany.mockResolvedValue([
        { id: 'PAL-00001', zone: 'A', aisle: 1, bay: 1, level: 1 },
        { id: 'PAL-00002', zone: 'B', aisle: 1, bay: 1, level: 2 },
      ]);
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...moving, ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'relocate',
        targetZone: 'B',
      });

      // Zone B, aisle/bay/level (1,1,1) is the pallet's own starting index — the search always
      // steps at least one slot forward, and (1,1,2) is occupied by PAL-00002, so it lands on (1,1,3).
      expect(pallet.logicalAddress).toEqual({
        id: 'LOC-B-01-01-03',
        zone: 'B',
        aisle: 1,
        bay: 1,
        level: 3,
      });
    });

    it('normalizes destination casing for set_destination', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(makePallet());
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'set_destination',
        targetDestination: 'BERN',
      });

      expect(pallet.destination).toBe('Bern');
    });

    it('applies an explicit status override for set_status', async () => {
      mockedDb.pallet.findUnique.mockResolvedValue(
        makePallet({ status: 'stored' }),
      );
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet } = await service.applyAction('PAL-00001', {
        action: 'set_status',
        targetStatus: 'transit',
      });

      expect(pallet.status).toBe('transit');
    });

    it('only updates lastScannedAt for scan, leaving status untouched', async () => {
      const original = makePallet({
        status: 'stored',
        lastScannedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      mockedDb.pallet.findUnique.mockResolvedValue(original);
      mockedDb.pallet.update.mockImplementation(({ data }) =>
        Promise.resolve(makePallet({ ...original, ...data })),
      );
      mockedDb.palletEvent.create.mockImplementation(({ data }) =>
        Promise.resolve(data),
      );

      const { pallet, event } = await service.applyAction('PAL-00001', {
        action: 'scan',
      });

      expect(pallet.status).toBe('stored');
      expect(event.type).toBe('scan');
      expect(pallet.lastScannedAt).not.toBe('2026-01-01T00:00:00.000Z');
    });
  });
});
