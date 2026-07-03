'use client';

import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { WAREHOUSE_CONFIG, CLAY_PALETTE } from '@/lib/constants';
import { groupRackRows } from '@/lib/warehouse-math';

const { SHELF_SIZE, LEVEL_HEIGHT, LEVELS_PER_BAY, START_OFFSET } = WAREHOUSE_CONFIG;

const POST_THICKNESS = 0.12;
const DECK_THICKNESS = 0.07;
// One shared upright cross-section roughly every this many bays (plus both row ends).
const BAYS_PER_UPRIGHT = 4;

type RackRow = {
    /** X centre of the row (aisle position). */
    x: number;
    /** Z centre of the row's occupied+padded bay span. */
    z: number;
    /** Total length of the row along Z. */
    lengthZ: number;
    /** Z positions of shared upright cross-sections. */
    uprightZs: number[];
};

// Turn each occupied rack-row extent into drawable structure: shared uprights
// spaced along the row plus both ends, and a continuous deck per level.
function buildRackRows(pallets: { logicalAddress: { zone: string; aisle: number; bay: number } }[]): RackRow[] {
    return groupRackRows(pallets).map(({ x, firstBay, lastBay, zStart, zEnd }) => {
        const lengthZ = zEnd - zStart;
        const uprightCount = Math.max(2, Math.ceil((lastBay - firstBay + 1) / BAYS_PER_UPRIGHT) + 1);
        const uprightZs: number[] = [];
        for (let i = 0; i < uprightCount; i++) {
            uprightZs.push(zStart + (lengthZ * (i / (uprightCount - 1))));
        }
        return { x, z: (zStart + zEnd) / 2, lengthZ, uprightZs };
    });
}

export const ShelfInstances = () => {
    const allPallets = useLogisticsStore((state) => state.pallets);

    const postRef = useRef<THREE.InstancedMesh>(null);
    const deckRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const rows = useMemo(() => buildRackRows(allPallets), [allPallets]);

    const rackHeight = (LEVELS_PER_BAY * LEVEL_HEIGHT) + 0.2;
    // Two uprights (front + back in X) per cross-section.
    const postHalfWidth = (SHELF_SIZE[0] / 2) - (POST_THICKNESS / 2);
    const deckWidthX = SHELF_SIZE[0] * 0.92;

    const totalPosts = rows.reduce((sum, row) => sum + (row.uprightZs.length * 2), 0);
    const totalDecks = rows.length * LEVELS_PER_BAY;

    useLayoutEffect(() => {
        if (!postRef.current || !deckRef.current || rows.length === 0) return;

        let postCounter = 0;
        let deckCounter = 0;

        rows.forEach((row) => {
            // Shared uprights: two posts (front/back in X) at each cross-section.
            row.uprightZs.forEach((z) => {
                for (const signX of [-1, 1] as const) {
                    dummy.position.set(row.x + (signX * postHalfWidth), START_OFFSET.y + (rackHeight / 2), z);
                    dummy.scale.set(POST_THICKNESS, rackHeight, POST_THICKNESS);
                    dummy.updateMatrix();
                    postRef.current!.setMatrixAt(postCounter++, dummy.matrix);
                }
            });

            // One continuous deck slab per level, spanning the row's Z length.
            for (let level = 0; level < LEVELS_PER_BAY; level++) {
                dummy.position.set(row.x, START_OFFSET.y + (level * LEVEL_HEIGHT) + 0.08, row.z);
                dummy.scale.set(deckWidthX, DECK_THICKNESS, row.lengthZ);
                dummy.updateMatrix();
                deckRef.current!.setMatrixAt(deckCounter++, dummy.matrix);
            }
        });

        postRef.current.instanceMatrix.needsUpdate = true;
        deckRef.current.instanceMatrix.needsUpdate = true;
    }, [rows, dummy, rackHeight, postHalfWidth, deckWidthX]);

    if (rows.length === 0) return null;

    return (
        <>
            <instancedMesh ref={postRef} args={[undefined, undefined, totalPosts]} raycast={() => null}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={CLAY_PALETTE.shelf.post} roughness={0.95} metalness={0.02} />
            </instancedMesh>

            <instancedMesh ref={deckRef} args={[undefined, undefined, totalDecks]} raycast={() => null}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={CLAY_PALETTE.shelf.deck} roughness={0.95} metalness={0.02} />
            </instancedMesh>
        </>
    );
};
