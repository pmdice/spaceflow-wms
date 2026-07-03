'use client';

import { useMemo } from 'react';
import { RoundedBox, ContactShadows } from '@react-three/drei';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { WAREHOUSE_CONFIG, CLAY_PALETTE } from '@/lib/constants';
import { computeWarehouseLayout } from '@/lib/warehouse-math';

const { START_OFFSET, LEVELS_PER_BAY, LEVEL_HEIGHT } = WAREHOUSE_CONFIG;
const RACK_HEIGHT = LEVELS_PER_BAY * LEVEL_HEIGHT + 0.2;

// Margin (world units) of plate/base beyond the racks they carry.
const ZONE_PLATE_MARGIN = 1.4;
const BASE_MARGIN = 3.2;

const FLOOR_TOP_Y = START_OFFSET.y; // racks + pallets sit at/above this plane
const ZONE_PLATE_HEIGHT = 0.14;
const BASE_HEIGHT = 0.5;

// Grounds the model: a diorama base board the whole warehouse rests on, plus a
// gently tinted floor plate per zone so A / B / C read apart at floor level.
export const WarehouseStaging = () => {
    const allPallets = useLogisticsStore((state) => state.pallets);
    const layout = useMemo(() => computeWarehouseLayout(allPallets), [allPallets]);

    if (!layout.bounds) return null;
    const { bounds, zones } = layout;

    const baseWidth = bounds.maxX - bounds.minX + BASE_MARGIN * 2;
    const baseDepth = bounds.maxZ - bounds.minZ + BASE_MARGIN * 2;

    return (
        <group>
            {/* Soft grounding shadow of the racks + pallets on the floor. */}
            <ContactShadows
                position={[bounds.centerX, FLOOR_TOP_Y + 0.02, bounds.centerZ]}
                scale={[baseWidth, baseDepth]}
                resolution={1024}
                blur={2.6}
                opacity={0.42}
                far={RACK_HEIGHT + 2}
                color={CLAY_PALETTE.contactShadow}
            />

            {/* Diorama base board — the surface the whole model sits on. */}
            <RoundedBox
                args={[baseWidth, BASE_HEIGHT, baseDepth]}
                radius={0.25}
                smoothness={3}
                position={[bounds.centerX, FLOOR_TOP_Y - ZONE_PLATE_HEIGHT - BASE_HEIGHT / 2, bounds.centerZ]}
                receiveShadow
                raycast={() => null}
            >
                <meshStandardMaterial color={CLAY_PALETTE.floor.base} roughness={0.98} metalness={0} />
            </RoundedBox>

            {/* Per-zone floor plates, flush with the floor plane. */}
            {zones.map((zone) => {
                const width = zone.maxX - zone.minX + ZONE_PLATE_MARGIN * 2;
                const depth = zone.maxZ - zone.minZ + ZONE_PLATE_MARGIN * 2;
                const color = CLAY_PALETTE.floor.zonePlate[zone.zone] ?? CLAY_PALETTE.floor.zonePlate.A;
                return (
                    <RoundedBox
                        key={zone.zone}
                        args={[width, ZONE_PLATE_HEIGHT, depth]}
                        radius={0.12}
                        smoothness={3}
                        position={[zone.centerX, FLOOR_TOP_Y - ZONE_PLATE_HEIGHT / 2, zone.centerZ]}
                        receiveShadow
                        raycast={() => null}
                    >
                        <meshStandardMaterial color={color} roughness={0.98} metalness={0} />
                    </RoundedBox>
                );
            })}
        </group>
    );
};
