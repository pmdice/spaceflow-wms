import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
    findAllPallets,
    applyPalletAction,
    PalletValidationError,
    PalletNotFoundError,
} from '@spaceflow/pallets';
import type { SpatialPallet, PalletEvent } from '@spaceflow/wms-types';

@Injectable()
export class PalletsService {
    async findAll(): Promise<SpatialPallet[]> {
        return findAllPallets();
    }

    async applyAction(id: string, rawBody: unknown): Promise<{ pallet: SpatialPallet; event: PalletEvent }> {
        try {
            return await applyPalletAction(id, rawBody);
        } catch (err) {
            if (err instanceof PalletValidationError) {
                throw new BadRequestException(err.issues);
            }
            if (err instanceof PalletNotFoundError) {
                throw new NotFoundException(err.message);
            }
            throw err;
        }
    }
}
