'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { calculate3DPosition } from '@/lib/warehouse-math';
import { WAREHOUSE_CONFIG } from '@/lib/constants';
import type { SpatialPallet } from '@/types/wms';

const BaseColor = "#90a4bf";
const FilterColor = "#BC804C";
const HoverColor = "#d29a67";
const SelectedColor = "#8f6136";
const ZoneColors: Record<string, string> = {
    A: "#7da7e6",
    B: "#7ccf9e",
    C: "#e0b86a",
};

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

    const colorByPalletId = useMemo(() => {
        const map = new Map<string, string>();
        filteredPallets.forEach((pallet) => {
            if (selectedPalletId === pallet.id) {
                map.set(pallet.id, SelectedColor);
            } else if (hoveredPalletId === pallet.id) {
                map.set(pallet.id, HoverColor);
            } else if (isFilterActive && highlightColorHex) {
                map.set(pallet.id, highlightColorHex);
            } else if (isFilterActive) {
                map.set(pallet.id, FilterColor);
            } else {
                map.set(pallet.id, ZoneColors[pallet.logicalAddress.zone] ?? BaseColor);
            }
        });
        return map;
    }, [filteredPallets, hoveredPalletId, selectedPalletId, isFilterActive, highlightColorHex]);

    return (
        <group>
            {filteredPallets.map((pallet, index) => {
                const position = calculate3DPosition(pallet.logicalAddress);
                const y = position.y + (WAREHOUSE_CONFIG.PALLET_SIZE[1] / 2);
                const rotationY = ((index % 7) - 3) * 0.025;
                const meshColor = colorByPalletId.get(pallet.id) ?? BaseColor;

                return (
                    <mesh
                        key={pallet.id}
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
                        <boxGeometry args={WAREHOUSE_CONFIG.PALLET_SIZE} />
                        <meshStandardMaterial
                            color={meshColor}
                            roughness={0.45}
                            metalness={0.08}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};