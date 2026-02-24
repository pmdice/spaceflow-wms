'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { calculate3DPosition } from '@/lib/warehouse-math';
import { WAREHOUSE_CONFIG } from '@/lib/constants';
import type { SpatialPallet } from '@/types/wms';

const BaseColor = new THREE.Color("#90a4bf");
const HoverColor = new THREE.Color("#1d4ed8");
const SelectedColor = new THREE.Color("#f97316");

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

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummyMatrix = useMemo(() => new THREE.Object3D(), []);
    const highlightColor = useMemo(() => new THREE.Color(), []);

    useEffect(() => {
        if (!meshRef.current || filteredPallets.length === 0) return;

        filteredPallets.forEach((pallet, index) => {
            // A) Position berechnen
            const position = calculate3DPosition(pallet.logicalAddress);
            dummyMatrix.position.set(
                position.x,
                position.y + (WAREHOUSE_CONFIG.PALLET_SIZE[1] / 2),
                position.z
            );

            // Deterministischer Winkel pro Instanz für konsistente Darstellung
            dummyMatrix.rotation.y = ((index % 7) - 3) * 0.025;

            dummyMatrix.updateMatrix();
            meshRef.current!.setMatrixAt(index, dummyMatrix.matrix);

            // B) Farbe bestimmen
            if (selectedPalletId === pallet.id) {
                meshRef.current!.setColorAt(index, SelectedColor);
            } else if (hoveredPalletId === pallet.id) {
                meshRef.current!.setColorAt(index, HoverColor);
            } else if (isFilterActive && highlightColorHex) {
                highlightColor.set(highlightColorHex);
                meshRef.current!.setColorAt(index, highlightColor);
            } else if (isFilterActive && !highlightColorHex) {
                highlightColor.set("#3b82f6");
                meshRef.current!.setColorAt(index, highlightColor);
            } else {
                meshRef.current!.setColorAt(index, BaseColor);
            }
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [filteredPallets, hoveredPalletId, selectedPalletId, isFilterActive, highlightColorHex, dummyMatrix, highlightColor]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, filteredPallets.length]}
            onPointerMove={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                if (event.instanceId === undefined) return;

                const pallet = filteredPallets[event.instanceId];
                if (!pallet) return;

                setHoveredPalletId(pallet.id);
                onHoverInfoChange?.({
                    pallet,
                    clientX: event.nativeEvent.clientX,
                    clientY: event.nativeEvent.clientY,
                });
            }}
            onPointerOut={() => {
                setHoveredPalletId(null);
                onHoverInfoChange?.(null);
            }}
            onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                if (event.instanceId === undefined) return;
                const pallet = filteredPallets[event.instanceId];
                if (!pallet) return;
                setSelectedPalletId(pallet.id);
            }}
        >
            <boxGeometry args={WAREHOUSE_CONFIG.PALLET_SIZE} />
            <meshStandardMaterial
                vertexColors
                roughness={0.45}
                metalness={0.08}
            />
        </instancedMesh>
    );
};