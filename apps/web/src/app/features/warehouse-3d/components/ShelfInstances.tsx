'use client';

import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { WAREHOUSE_CONFIG, CLAY_PALETTE } from '@/lib/constants';
import { calculate3DPosition } from '@/lib/warehouse-math';

const { SHELF_SIZE, LEVEL_HEIGHT, LEVELS_PER_BAY, START_OFFSET, AISLE_COUNT, BAYS_PER_AISLE, ZONES } = WAREHOUSE_CONFIG;

const POST_THICKNESS = 0.1;
const POST_CORNER_SIGNS: Array<[number, number]> = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
];

export const ShelfInstances = () => {
    const allPallets = useLogisticsStore((state) => state.pallets);

    const postRef = useRef<THREE.InstancedMesh>(null);
    const deckRef = useRef<THREE.InstancedMesh>(null);

    const postDummy = useMemo(() => new THREE.Object3D(), []);
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
    const totalPosts = totalRacks * 4;
    const totalDecks = totalRacks * LEVELS_PER_BAY;

    // Constant rack height for all bays to mimic real warehouse shelving.
    const rackHeight = (LEVELS_PER_BAY * LEVEL_HEIGHT) + 0.2;
    const postSize: [number, number, number] = [POST_THICKNESS, rackHeight, POST_THICKNESS];
    const deckSize: [number, number, number] = [SHELF_SIZE[0] * 0.9, 0.05, SHELF_SIZE[2] * 0.9];
    const postHalfWidth = (SHELF_SIZE[0] / 2) - (POST_THICKNESS / 2);
    const postHalfDepth = (SHELF_SIZE[2] / 2) - (POST_THICKNESS / 2);

    useLayoutEffect(() => {
        if (!postRef.current || !deckRef.current || totalRacks === 0) return;

        let postCounter = 0;
        let deckCounter = 0;

        rackBays.forEach((bay) => {
            POST_CORNER_SIGNS.forEach(([signX, signZ]) => {
                postDummy.position.set(
                    bay.x + (signX * postHalfWidth),
                    START_OFFSET.y + (rackHeight / 2),
                    bay.z + (signZ * postHalfDepth)
                );
                postDummy.scale.set(1, 1, 1);
                postDummy.updateMatrix();
                postRef.current!.setMatrixAt(postCounter++, postDummy.matrix);
            });

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
            }
        });

        postRef.current.instanceMatrix.needsUpdate = true;
        deckRef.current.instanceMatrix.needsUpdate = true;
    }, [rackBays, postDummy, deckDummy, totalRacks, rackHeight, postHalfWidth, postHalfDepth]);

    if (totalRacks === 0) return null;

    return (
        <>
            <instancedMesh ref={postRef} args={[undefined, undefined, totalPosts]} raycast={() => null}>
                <boxGeometry args={postSize} />
                <meshStandardMaterial color={CLAY_PALETTE.shelf.post} roughness={0.95} metalness={0.02} />
            </instancedMesh>

            <instancedMesh ref={deckRef} args={[undefined, undefined, totalDecks]} raycast={() => null}>
                <boxGeometry args={deckSize} />
                <meshStandardMaterial color={CLAY_PALETTE.shelf.deck} roughness={0.95} metalness={0.02} />
            </instancedMesh>
        </>
    );
};