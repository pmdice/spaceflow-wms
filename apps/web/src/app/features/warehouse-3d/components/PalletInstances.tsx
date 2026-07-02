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
