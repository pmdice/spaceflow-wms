# 3D Warehouse Scene Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the 3D warehouse scene to a clay-render material system — one warm off-white matte material family across floor/shelves/pallets, with the pallet urgency signal implemented as emissive glow instead of flat color fill, hover/selection/filter states as outlines instead of color swaps, opaque open-frame shelving, rounded pallet geometry, and softened lighting.

**Architecture:** A new `CLAY_PALETTE` constant centralizes every color value so the three component files (`PalletInstances`, `ShelfInstances`, `WarehouseScene`) share one source of truth. The one piece of genuine decision logic — which outline (if any) a pallet gets — is extracted into a small pure function with its own unit tests; everything else is direct material/geometry/lighting prop changes with no new business logic.

**Tech Stack:** React Three Fiber, `@react-three/drei` ^10.7.7 (using its `RoundedBox` and `Outlines` components), Vitest for the one pure-logic unit test file.

## Global Constraints

- Package manager: `pnpm@10.30.3`.
- No changes to `CameraFocusController`, `OrbitControls` configuration, or any camera animation logic in `WarehouseScene.tsx`.
- No changes to interaction *state* logic (hover/selection/filter management in the Zustand store) — only how those states are rendered.
- No changes to the hover tooltip UI (the HTML overlay in `WarehouseScene.tsx`).
- No post-processing pipeline (no SSAO or other new render passes) — the softer look comes from lighting/material changes only.
- No changes to `apps/web/src/lib/warehouse-math.ts`.
- Follow existing code style: 4-space indent in `apps/web`.
- Test convention in `apps/web`: Vitest, colocated `*.test.ts` files (matches `apps/web/src/store/filter-pallets.test.ts`).
- This is a pure visual-styling change — most of it (material colors, geometry swaps, light intensities) has no meaningful unit-testable behavior. Only the outline-precedence decision (Task 2) gets a TDD cycle; the rest is implemented directly and verified by building, linting, and (where possible) actually running the app.

---

### Task 1: Shared clay color palette

**Files:**
- Modify: `apps/web/src/lib/constants.ts`
- Test: `apps/web/src/lib/constants.test.ts`

**Interfaces:**
- Produces: `CLAY_PALETTE` — `{ base: string; zoneShelf: Record<string, string>; urgentGlow: string; outline: { hover: string; selected: string; filterDefault: string }; background: string; grid: { cell: string; section: string } }`. Tasks 2, 3, and 4 all import from this.

- [ ] **Step 1: Write the failing test**

`apps/web/src/lib/constants.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLAY_PALETTE } from './constants';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

describe('CLAY_PALETTE', () => {
    it('defines a shelf tint for every warehouse zone', () => {
        expect(Object.keys(CLAY_PALETTE.zoneShelf).sort()).toEqual(['A', 'B', 'C']);
    });

    it('uses valid 6-digit hex colors for every value', () => {
        const allColors = [
            CLAY_PALETTE.base,
            CLAY_PALETTE.zoneShelf.A,
            CLAY_PALETTE.zoneShelf.B,
            CLAY_PALETTE.zoneShelf.C,
            CLAY_PALETTE.urgentGlow,
            CLAY_PALETTE.outline.hover,
            CLAY_PALETTE.outline.selected,
            CLAY_PALETTE.outline.filterDefault,
            CLAY_PALETTE.background,
            CLAY_PALETTE.grid.cell,
            CLAY_PALETTE.grid.section,
        ];

        allColors.forEach((color) => {
            expect(color).toMatch(HEX_COLOR);
        });
    });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
pnpm --filter @spaceflow/web exec vitest run constants
```

Expected: FAIL — `CLAY_PALETTE` is not exported from `./constants`.

- [ ] **Step 3: Add the palette**

Append to the end of `apps/web/src/lib/constants.ts` (the existing `WAREHOUSE_CONFIG` export stays exactly as-is above this):

```ts
const CLAY_ZONE_SHELF_COLORS: Record<string, string> = {
    A: '#ebe4d8',
    B: '#e6dfd0',
    C: '#e0d6c2',
};

export const CLAY_PALETTE = {
    base: '#f0e9dc',
    zoneShelf: CLAY_ZONE_SHELF_COLORS,
    urgentGlow: '#ff5a3c',
    outline: {
        hover: '#8a8073',
        selected: '#2b2620',
        filterDefault: '#BC804C',
    },
    background: '#f5f0e6',
    grid: {
        cell: '#e4dbc8',
        section: '#c9bea8',
    },
};
```

`zoneShelf` is explicitly typed `Record<string, string>` (not inferred from the object literal) so it can be indexed by an arbitrary zone string later (matching the existing `ZoneColors: Record<string, string>` pattern already used in `PalletInstances.tsx` and `ShelfInstances.tsx`), without needing an unsafe cast at the call site.

- [ ] **Step 4: Run the test again**

```bash
pnpm --filter @spaceflow/web exec vitest run constants
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/constants.ts apps/web/src/lib/constants.test.ts
git commit -m "feat(web): add shared clay color palette for the 3D scene"
```

---

### Task 2: Pallet outline logic + pallet geometry/material rewrite

**Files:**
- Create: `apps/web/src/app/features/warehouse-3d/lib/pallet-outline.ts`
- Create: `apps/web/src/app/features/warehouse-3d/lib/pallet-outline.test.ts`
- Modify: `apps/web/src/app/features/warehouse-3d/components/PalletInstances.tsx`

**Interfaces:**
- Consumes: `CLAY_PALETTE` (Task 1).
- Produces: `getPalletOutline(input): PalletOutline`, `type PalletOutline = { color: string; thickness: number } | null`. Used only within `PalletInstances.tsx`.

- [ ] **Step 1: Write the failing test for the outline-precedence logic**

`apps/web/src/app/features/warehouse-3d/lib/pallet-outline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getPalletOutline } from './pallet-outline';
import { CLAY_PALETTE } from '@/lib/constants';

describe('getPalletOutline', () => {
    it('returns no outline when nothing applies', () => {
        expect(
            getPalletOutline({ isSelected: false, isHovered: false, isFilterActive: false, highlightColorHex: null }),
        ).toBeNull();
    });

    it('prioritizes selection over hover and filter', () => {
        const result = getPalletOutline({
            isSelected: true,
            isHovered: true,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.selected, thickness: 3 });
    });

    it('prioritizes hover over filter when not selected', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: true,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.hover, thickness: 1.5 });
    });

    it('uses the AI filter highlight color when one is provided', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: false,
            isFilterActive: true,
            highlightColorHex: '#ff0000',
        });
        expect(result).toEqual({ color: '#ff0000', thickness: 1.5 });
    });

    it('falls back to the default filter accent color when the AI did not specify one', () => {
        const result = getPalletOutline({
            isSelected: false,
            isHovered: false,
            isFilterActive: true,
            highlightColorHex: null,
        });
        expect(result).toEqual({ color: CLAY_PALETTE.outline.filterDefault, thickness: 1.5 });
    });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
pnpm --filter @spaceflow/web exec vitest run pallet-outline
```

Expected: FAIL — `Cannot find module './pallet-outline'`.

- [ ] **Step 3: Write the function**

`apps/web/src/app/features/warehouse-3d/lib/pallet-outline.ts`:

```ts
import { CLAY_PALETTE } from '@/lib/constants';

export type PalletOutline = { color: string; thickness: number } | null;

export function getPalletOutline({
    isSelected,
    isHovered,
    isFilterActive,
    highlightColorHex,
}: {
    isSelected: boolean;
    isHovered: boolean;
    isFilterActive: boolean;
    highlightColorHex: string | null;
}): PalletOutline {
    if (isSelected) {
        return { color: CLAY_PALETTE.outline.selected, thickness: 3 };
    }
    if (isHovered) {
        return { color: CLAY_PALETTE.outline.hover, thickness: 1.5 };
    }
    if (isFilterActive) {
        return { color: highlightColorHex ?? CLAY_PALETTE.outline.filterDefault, thickness: 1.5 };
    }
    return null;
}
```

- [ ] **Step 4: Run the test again**

```bash
pnpm --filter @spaceflow/web exec vitest run pallet-outline
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Rewrite `PalletInstances.tsx`**

Replace the full contents of `apps/web/src/app/features/warehouse-3d/components/PalletInstances.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { Outlines, RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { calculate3DPosition } from '@/lib/warehouse-math';
import { WAREHOUSE_CONFIG, CLAY_PALETTE } from '@/lib/constants';
import type { SpatialPallet } from '@/types/wms';
import { getPalletOutline, type PalletOutline } from '../lib/pallet-outline';

type PalletInstancesProps = {
    onHoverInfoChange?: (payload: { pallet: SpatialPallet; clientX: number; clientY: number } | null) => void;
};

export const PalletInstances = ({ onHoverInfoChange }: PalletInstancesProps) => {
    const allPallets = useLogisticsStore((state) => state.pallets);
    const filteredPallets = useLogisticsStore((state) => state.filteredPallets);
    const highlightColorHex = useLogisticsStore((state) => state.activeHighlightColor);
    const hoveredPalletId = useLogisticsStore((state) => state.hoveredPalletId);
    const setHoveredPalletId = useLogisticsStore((state) => state.setHoveredPalletId);
    const selectedPalletId = useLogisticsStore((state) => state.selectedPalletId);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);
    const isFilterActive = allPallets.length !== filteredPallets.length;

    const outlineByPalletId = useMemo(() => {
        const map = new Map<string, PalletOutline>();
        filteredPallets.forEach((pallet) => {
            map.set(
                pallet.id,
                getPalletOutline({
                    isSelected: selectedPalletId === pallet.id,
                    isHovered: hoveredPalletId === pallet.id,
                    isFilterActive,
                    highlightColorHex,
                }),
            );
        });
        return map;
    }, [filteredPallets, hoveredPalletId, selectedPalletId, isFilterActive, highlightColorHex]);

    return (
        <group>
            {filteredPallets.map((pallet, index) => {
                const position = calculate3DPosition(pallet.logicalAddress);
                const y = position.y + (WAREHOUSE_CONFIG.PALLET_SIZE[1] / 2);
                const rotationY = ((index % 7) - 3) * 0.025;
                const outline = outlineByPalletId.get(pallet.id) ?? null;
                const isUrgent = pallet.urgency === 'high';

                return (
                    <RoundedBox
                        key={pallet.id}
                        args={WAREHOUSE_CONFIG.PALLET_SIZE}
                        radius={0.1}
                        smoothness={4}
                        position={[position.x, y, position.z]}
                        rotation={[0, rotationY, 0]}
                        onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                            event.stopPropagation();
                            setHoveredPalletId(pallet.id);
                        }}
                        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
                            event.stopPropagation();
                            onHoverInfoChange?.({
                                pallet,
                                clientX: event.nativeEvent.clientX,
                                clientY: event.nativeEvent.clientY,
                            });
                        }}
                        onPointerOut={(event: ThreeEvent<PointerEvent>) => {
                            event.stopPropagation();
                            setHoveredPalletId(null);
                            onHoverInfoChange?.(null);
                        }}
                        onClick={(event: ThreeEvent<MouseEvent>) => {
                            event.stopPropagation();
                            setSelectedPalletId(pallet.id);
                        }}
                    >
                        <meshStandardMaterial
                            color={CLAY_PALETTE.base}
                            roughness={0.92}
                            metalness={0.02}
                            emissive={isUrgent ? CLAY_PALETTE.urgentGlow : '#000000'}
                            emissiveIntensity={isUrgent ? 0.9 : 0}
                        />
                        {outline && <Outlines color={outline.color} thickness={outline.thickness} />}
                    </RoundedBox>
                );
            })}
        </group>
    );
};
```

The only behavioral changes from the previous version: pallets are geometrically rounded boxes instead of sharp boxes; color no longer varies by zone/hover/selection/filter (always `CLAY_PALETTE.base`, i.e. plain clay) except for the emissive glow on `urgency === 'high'` pallets; hover/selection/filter are now outlines rendered via `<Outlines>` instead of fill-color changes. All existing pointer/click event wiring is unchanged.

- [ ] **Step 6: Confirm the web app builds and existing tests still pass**

```bash
pnpm --filter @spaceflow/web build
pnpm --filter @spaceflow/web test
```

Expected: both succeed. Test count is now 5 existing (`filter-pallets.test.ts`, `logistics-kpis.test.ts`) + 2 (`constants.test.ts`, from Task 1) + 5 (`pallet-outline.test.ts`) = 12.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/features/warehouse-3d/lib/pallet-outline.ts \
        apps/web/src/app/features/warehouse-3d/lib/pallet-outline.test.ts \
        apps/web/src/app/features/warehouse-3d/components/PalletInstances.tsx
git commit -m "feat(web): rounded clay pallets with emissive urgency glow and outline states"
```

---

### Task 3: Open-frame opaque shelving

**Files:**
- Modify: `apps/web/src/app/features/warehouse-3d/components/ShelfInstances.tsx`

**Interfaces:**
- Consumes: `CLAY_PALETTE.zoneShelf` (Task 1).
- Produces: no exported interface change — `ShelfInstances` is still a no-props component rendering into the parent `<Canvas>`, same as before.

This task has no new pure logic to extract — like the current implementation, it's imperative `THREE.InstancedMesh` buffer manipulation (`useLayoutEffect` writing matrices/colors into instance buffers), which is exactly the pattern the existing untested version already uses. There is no unit-testable behavior change here beyond what direct build/visual verification (Task 5) covers.

- [ ] **Step 1: Replace the full contents of `ShelfInstances.tsx`**

```tsx
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
            const shelfColor = new THREE.Color(CLAY_PALETTE.zoneShelf[bay.zone] ?? CLAY_PALETTE.zoneShelf.A);

            POST_CORNER_SIGNS.forEach(([signX, signZ]) => {
                postDummy.position.set(
                    bay.x + (signX * postHalfWidth),
                    START_OFFSET.y + (rackHeight / 2),
                    bay.z + (signZ * postHalfDepth)
                );
                postDummy.scale.set(1, 1, 1);
                postDummy.updateMatrix();
                postRef.current!.setMatrixAt(postCounter++, postDummy.matrix);
                postRef.current!.setColorAt(postCounter - 1, shelfColor);
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
                deckRef.current!.setColorAt(deckCounter - 1, shelfColor);
            }
        });

        postRef.current.instanceMatrix.needsUpdate = true;
        deckRef.current.instanceMatrix.needsUpdate = true;
        if (postRef.current.instanceColor) postRef.current.instanceColor.needsUpdate = true;
        if (deckRef.current.instanceColor) deckRef.current.instanceColor.needsUpdate = true;
    }, [rackBays, postDummy, deckDummy, totalRacks, rackHeight, postHalfWidth, postHalfDepth]);

    if (totalRacks === 0) return null;

    return (
        <>
            <instancedMesh ref={postRef} args={[undefined, undefined, totalPosts]} raycast={() => null}>
                <boxGeometry args={postSize} />
                <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
            </instancedMesh>

            <instancedMesh ref={deckRef} args={[undefined, undefined, totalDecks]} raycast={() => null}>
                <boxGeometry args={deckSize} />
                <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
            </instancedMesh>
        </>
    );
};
```

Changes from the previous version: the single bulky semi-transparent "frame" `InstancedMesh` (one instance per bay, covering the whole bay volume) is replaced with a "post" `InstancedMesh` (four thin vertical corner posts per bay — `totalRacks * 4` instances). The "deck" `InstancedMesh` keeps its existing count/positioning logic, but drops `transparent`/`opacity` — it's now fully opaque, same as the posts. Both materials use the same clay roughness/metalness as pallets (`0.92`/`0.02`) for one consistent material family across the scene.

- [ ] **Step 2: Confirm the web app builds**

```bash
pnpm --filter @spaceflow/web build
```

Expected: succeeds with no type errors. `postHalfWidth`/`postHalfDepth` computed from `SHELF_SIZE` ensure the four posts sit at the actual corners of each bay's footprint regardless of `WAREHOUSE_CONFIG.SHELF_SIZE` changing later.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/features/warehouse-3d/components/ShelfInstances.tsx
git commit -m "feat(web): rebuild shelving as an opaque open post-and-deck frame"
```

---

### Task 4: Scene lighting, background, and grid

**Files:**
- Modify: `apps/web/src/app/features/warehouse-3d/components/WarehouseScene.tsx`

**Interfaces:**
- Consumes: `CLAY_PALETTE.background`, `CLAY_PALETTE.grid` (Task 1).
- Produces: no interface change — `WarehouseScene`'s props and exported behavior are unchanged.

- [ ] **Step 1: Import the palette**

In `apps/web/src/app/features/warehouse-3d/components/WarehouseScene.tsx`, add to the existing import block (near the top, alongside the other `@/lib/*` imports):

```tsx
import { WAREHOUSE_CONFIG, CLAY_PALETTE } from '@/lib/constants';
```

(This replaces whatever the current import of `WAREHOUSE_CONFIG` alone looks like — check the file's actual current import line and adjust it to include `CLAY_PALETTE` in the same `from '@/lib/constants'` import rather than adding a second import line.)

- [ ] **Step 2: Update the Canvas shadow type, background, fog, and lighting**

Replace:

```tsx
            <Canvas
                camera={{ position: [20, 20, 20], fov: 50 }}
                shadows={{ type: THREE.PCFShadowMap }}
                onPointerMissed={() => setSelectedPalletId(null)}
            >
                {/* Light, clean backdrop inspired by reference */}
                <color attach="background" args={['#eef2f8']} />
                <fog attach="fog" args={['#f0f2f5', 45, 170]} />

                {/* Soft studio-like lighting */}
                <ambientLight intensity={0.75} />
                <hemisphereLight args={['#ffffff', '#d8e2f2', 0.4]} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.1}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                {/* Ground reference grid */}
                <Grid
                    position={[0, -0.1, 0]}
                    args={[100, 100]}
                    cellSize={2}
                    cellThickness={0.6}
                    cellColor="#cfd8e8"
                    sectionSize={10}
                    sectionThickness={1}
                    sectionColor="#9fb0cb"
                    fadeDistance={50}
                    raycast={() => null}
                />
                <ZoneBands />

                {/* Scene geometry */}
                <ShelfInstances />
```

with:

```tsx
            <Canvas
                camera={{ position: [20, 20, 20], fov: 50 }}
                shadows={{ type: THREE.PCFSoftShadowMap }}
                onPointerMissed={() => setSelectedPalletId(null)}
            >
                {/* Warm, matte clay backdrop */}
                <color attach="background" args={[CLAY_PALETTE.background]} />
                <fog attach="fog" args={[CLAY_PALETTE.background, 45, 170]} />

                {/* Soft, even studio-like lighting */}
                <ambientLight intensity={0.95} />
                <hemisphereLight args={['#ffffff', '#d8e2f2', 0.55]} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={0.85}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                {/* Ground reference grid */}
                <Grid
                    position={[0, -0.1, 0]}
                    args={[100, 100]}
                    cellSize={2}
                    cellThickness={0.6}
                    cellColor={CLAY_PALETTE.grid.cell}
                    sectionSize={10}
                    sectionThickness={1}
                    sectionColor={CLAY_PALETTE.grid.section}
                    fadeDistance={50}
                    raycast={() => null}
                />

                {/* Scene geometry */}
                <ShelfInstances />
```

Note the `<ZoneBands />` line is deleted (not replaced) — the colored floor zone-bands are removed entirely per the spec.

- [ ] **Step 3: Remove the now-unused `ZoneBands` function**

Delete the entire `function ZoneBands() { ... }` block from the bottom of `WarehouseScene.tsx` (it was only ever called from the line removed in Step 2, and has no other callers — confirm with `grep -n "ZoneBands" apps/web/src/app/features/warehouse-3d/components/WarehouseScene.tsx` before deleting, which should show only the definition after Step 2's edit, no remaining call sites).

- [ ] **Step 4: Confirm the web app builds and lints clean**

```bash
pnpm --filter @spaceflow/web build
pnpm --filter @spaceflow/web lint
```

Expected: both succeed. If lint flags an unused import (e.g. if `WAREHOUSE_CONFIG.ZONES` was only used inside the deleted `ZoneBands` function and nothing else in the file references `WAREHOUSE_CONFIG.ZONES`), that's fine — `WAREHOUSE_CONFIG` itself is still used elsewhere in the file (e.g. `WAREHOUSE_CONFIG.PALLET_SIZE` in `CameraFocusController`), so the import line itself doesn't become unused, only a specific property access inside the deleted function goes away along with it.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/features/warehouse-3d/components/WarehouseScene.tsx
git commit -m "feat(web): soften scene lighting and remove colored floor zone-bands"
```

---

### Task 5: Full verification

**Files:**
- None (verification only).

- [ ] **Step 1: Run the full web build, lint, and test suite**

```bash
pnpm --filter @spaceflow/web build
pnpm --filter @spaceflow/web lint
pnpm --filter @spaceflow/web test
```

Expected: all succeed. Test count: 12 (5 pre-existing + 2 from Task 1 + 5 from Task 2).

- [ ] **Step 2: Attempt a real visual check**

If your environment has a `run` skill available (invoke it via the Skill tool with `skill: "run"` — check your available-skills list first), use it to launch the app, navigate to `/inventory` or `/dashboard` (whichever route renders `WarehouseScene`), and visually confirm: the scene reads as warm off-white/clay rather than cool blue-grey, shelves are visibly solid (not ghostly transparent) with visible open gaps between posts, pallets are rounded rather than sharp-cornered, and any pallet with `urgency: 'high'` in the seed data visibly glows.

If no browser/screenshot tool is available in this environment, say so explicitly in your task report rather than claiming visual verification happened — the build/lint/test results in Step 1 confirm the code is correct and type-safe, but do not confirm the visual result actually looks right. Flag this as an open item for the user to check themselves.

- [ ] **Step 3: Review the full diff against `origin/development`**

```bash
git diff origin/development...feat/3d-visual-polish --stat
```

Expected: only `apps/web/src/lib/constants.ts`, `apps/web/src/lib/constants.test.ts`, `apps/web/src/app/features/warehouse-3d/lib/pallet-outline.ts`, `apps/web/src/app/features/warehouse-3d/lib/pallet-outline.test.ts`, and the three `apps/web/src/app/features/warehouse-3d/components/*.tsx` files appear. Do not push or open a PR yet — confirm with the user first.
