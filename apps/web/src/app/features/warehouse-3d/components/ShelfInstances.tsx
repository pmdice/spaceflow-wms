'use client';

import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { WAREHOUSE_CONFIG } from '@/lib/constants';
import { calculate3DPosition } from '@/lib/warehouse-math';

const { SHELF_SIZE, LEVEL_HEIGHT, LEVELS_PER_BAY, START_OFFSET, AISLE_COUNT, BAYS_PER_AISLE, ZONES } = WAREHOUSE_CONFIG;
const ZoneColors: Record<string, { frame: string; deck: string }> = {
    A: { frame: '#8da8d4', deck: '#eef4ff' },
    B: { frame: '#7fb69a', deck: '#eefbf3' },
    C: { frame: '#d2b07a', deck: '#fff8ec' },
};

export const ShelfInstances = () => {
    const allPallets = useLogisticsStore((state) => state.pallets);

    const frameRef = useRef<THREE.InstancedMesh>(null);
    const deckRef = useRef<THREE.InstancedMesh>(null);

    const frameDummy = useMemo(() => new THREE.Object3D(), []);
    const deckDummy = useMemo(() => new THREE.Object3D(), []);

    // Build a full warehouse grid so empty racks are visible too.
    const rackBays = useMemo(() => {
        const maxAisleInData = allPallets.reduce((max, pallet) => Math.max(max, pallet.logicalAddress.aisle), 0);
        const maxBayInData = allPallets.reduce((max, pallet) => Math.max(max, pallet.logicalAddress.bay), 0);
        const zonesInData = new Set(allPallets.map((pallet) => pallet.logicalAddress.zone));
        const zones = zonesInData.size ? Array.from(zonesInData) : [...ZONES];

        const aisleCount = Math.max(AISLE_COUNT, maxAisleInData);
        const bayCount = Math.max(BAYS_PER_AISLE, maxBayInData);

        const bays: Array<{ x: number; z: number; zone: string }> = [];
        for (const zone of zones) {
            for (let aisle = 1; aisle <= aisleCount; aisle++) {
                for (let bay = 1; bay <= bayCount; bay++) {
                    const position = calculate3DPosition({
                        id: '',
                        zone,
                        aisle,
                        bay,
                        level: 1,
                    });
                    bays.push({
                        x: position.x,
                        z: position.z,
                        zone,
                    });
                }
            }
        }

        return bays;
    }, [allPallets]);

    const totalRacks = rackBays.length;
    const totalDecks = totalRacks * LEVELS_PER_BAY;

    // Constant rack height for all bays to mimic real warehouse shelving.
    const rackHeight = (LEVELS_PER_BAY * LEVEL_HEIGHT) + 0.2;
    const rackSize: [number, number, number] = [SHELF_SIZE[0], rackHeight, SHELF_SIZE[2]];
    const deckSize: [number, number, number] = [SHELF_SIZE[0] * 0.9, 0.05, SHELF_SIZE[2] * 0.9];

    useLayoutEffect(() => {
        if (!frameRef.current || !deckRef.current || totalRacks === 0) return;

        let frameCounter = 0;
        let deckCounter = 0;

        rackBays.forEach((bay) => {
            const zonePalette = ZoneColors[bay.zone] ?? ZoneColors.A;
            frameDummy.position.set(
                bay.x,
                START_OFFSET.y + (rackHeight / 2),
                bay.z
            );
            frameDummy.scale.set(1, 1, 1);
            frameDummy.updateMatrix();
            frameRef.current!.setMatrixAt(frameCounter++, frameDummy.matrix);
            frameRef.current!.setColorAt(frameCounter - 1, new THREE.Color(zonePalette.frame));

            for (let level = 0; level < LEVELS_PER_BAY; level++) {
                // Decks are anchored from ground up at fixed level spacing.
                deckDummy.position.set(
                    bay.x,
                    START_OFFSET.y + (level * LEVEL_HEIGHT) + 0.08,
                    bay.z
                );
                deckDummy.scale.set(1, 1, 1);
                deckDummy.updateMatrix();
                deckRef.current!.setMatrixAt(deckCounter++, deckDummy.matrix);
                deckRef.current!.setColorAt(deckCounter - 1, new THREE.Color(zonePalette.deck));
            }
        });

        frameRef.current.instanceMatrix.needsUpdate = true;
        deckRef.current.instanceMatrix.needsUpdate = true;
        if (frameRef.current.instanceColor) frameRef.current.instanceColor.needsUpdate = true;
        if (deckRef.current.instanceColor) deckRef.current.instanceColor.needsUpdate = true;
    }, [rackBays, frameDummy, deckDummy, totalRacks, rackHeight]);

    if (totalRacks === 0) return null;

    return (
        <>
            <instancedMesh ref={frameRef} args={[undefined, undefined, totalRacks]} raycast={() => null}>
                <boxGeometry args={rackSize} />
                <meshStandardMaterial
                    vertexColors
                    roughness={0.75}
                    metalness={0.15}
                    transparent
                    opacity={0.14}
                />
            </instancedMesh>

            <instancedMesh ref={deckRef} args={[undefined, undefined, totalDecks]} raycast={() => null}>
                <boxGeometry args={deckSize} />
                <meshStandardMaterial
                    vertexColors
                    roughness={0.9}
                    metalness={0.05}
                    transparent
                    opacity={0.22}
                />
            </instancedMesh>
        </>
    );
};