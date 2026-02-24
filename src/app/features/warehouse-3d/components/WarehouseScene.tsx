'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { PalletInstances } from './PalletInstances';
import { ShelfInstances } from './ShelfInstances';
import type { SpatialPallet } from '@/types/wms';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { calculate3DPosition } from '@/lib/warehouse-math';
import { WAREHOUSE_CONFIG } from '@/lib/constants';

type HoverInfo = {
    pallet: SpatialPallet;
    x: number;
    y: number;
};

type WarehouseSceneProps = {
    isFullscreen3D?: boolean;
    isListExpanded?: boolean;
};

export const WarehouseScene = ({ isFullscreen3D = false, isListExpanded = false }: WarehouseSceneProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<any>(null);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);
    const selectedPalletId = useLogisticsStore((state) => state.selectedPalletId);
    const filteredPallets = useLogisticsStore((state) => state.filteredPallets);

    useEffect(() => {
        const originalWarn = console.warn;
        console.warn = (...args: unknown[]) => {
            const firstArg = typeof args[0] === 'string' ? args[0] : '';
            if (
                firstArg.includes('THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.') ||
                firstArg.includes('THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')
            ) {
                return;
            }
            originalWarn(...args);
        };

        return () => {
            console.warn = originalWarn;
        };
    }, []);

    const handleHoverInfoChange = useCallback((payload: { pallet: SpatialPallet; clientX: number; clientY: number } | null) => {
        if (!payload || !containerRef.current) {
            setHoverInfo(null);
            return;
        }

        const bounds = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 248;
        const tooltipHeight = 116;
        const padding = 12;

        const localX = payload.clientX - bounds.left + 10;
        const localY = payload.clientY - bounds.top + 10;

        setHoverInfo({
            pallet: payload.pallet,
            x: Math.min(Math.max(localX, padding), bounds.width - tooltipWidth - padding),
            y: Math.min(Math.max(localY, padding), bounds.height - tooltipHeight - padding),
        });
    }, []);

    return (
        <div ref={containerRef} className="relative h-full w-full">
            <Canvas
                camera={{ position: [20, 20, 20], fov: 50 }}
                shadows={{ type: THREE.PCFShadowMap }}
                onPointerMissed={() => setSelectedPalletId(null)}
            >
                {/* Light, clean backdrop inspired by reference */}
                <color attach="background" args={['#eef2f8']} />
                <fog attach="fog" args={['#f0f2f5', 30, 100]} />

                {/* Soft studio-like lighting */}
                <ambientLight intensity={0.75} />
                <hemisphereLight args={['#ffffff', '#d8e2f2', 0.4]} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.1}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <Environment preset="city" />

                {/* 3. Der Boden */}
                <Grid
                    position={[0, -0.1, 0]} // Leicht unter den Regalen
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

                {/* 4. Unsere 3D-Objekte */}
                <ShelfInstances />
                <PalletInstances onHoverInfoChange={handleHoverInfoChange} />
                <CameraFocusController
                    selectedPalletId={selectedPalletId}
                    pallets={filteredPallets}
                    controlsRef={controlsRef}
                    isFullscreen3D={isFullscreen3D}
                    isListExpanded={isListExpanded}
                />

                {/* 5. Steuerung */}
                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    maxDistance={60}
                    enableDamping={true}
                />
            </Canvas>

            {hoverInfo && (
                <div
                    className="pointer-events-none absolute z-20 min-w-[248px] rounded-xl border border-white/60 bg-white/85 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.2)] backdrop-blur-md"
                    style={{ left: hoverInfo.x, top: hoverInfo.y }}
                >
                    <div className="mb-1 flex items-center justify-between">
                        <p className="font-mono text-xs font-semibold text-slate-800">{hoverInfo.pallet.id}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {hoverInfo.pallet.status === 'transit' ? 'In Transit' : hoverInfo.pallet.status === 'stored' ? 'Stored' : 'Delayed'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-700"><span className="text-slate-500">Destination:</span> {hoverInfo.pallet.destination}</p>
                    <p className="text-xs text-slate-700"><span className="text-slate-500">Address:</span> {hoverInfo.pallet.logicalAddress.id}</p>
                    <p className="text-xs text-slate-700"><span className="text-slate-500">Weight:</span> {hoverInfo.pallet.weightKg} kg</p>
                </div>
            )}
        </div>
    );
};

function CameraFocusController({
    selectedPalletId,
    pallets,
    controlsRef,
    isFullscreen3D,
    isListExpanded,
}: {
    selectedPalletId: string | null;
    pallets: SpatialPallet[];
    controlsRef: React.RefObject<any>;
    isFullscreen3D: boolean;
    isListExpanded: boolean;
}) {
    const { camera } = useThree();
    const desiredCameraPos = useRef(new THREE.Vector3());
    const desiredTarget = useRef(new THREE.Vector3());
    const defaultCameraPos = useRef(new THREE.Vector3());
    const defaultTarget = useRef(new THREE.Vector3());
    const hasDefaults = useRef(false);
    const isAnimating = useRef(false);

    useEffect(() => {
        if (!controlsRef.current) return;

        if (!hasDefaults.current) {
            defaultCameraPos.current.copy(camera.position);
            defaultTarget.current.copy(controlsRef.current.target);
            desiredCameraPos.current.copy(camera.position);
            desiredTarget.current.copy(controlsRef.current.target);
            hasDefaults.current = true;
        }

        if (!selectedPalletId) {
            desiredCameraPos.current.copy(defaultCameraPos.current);
            desiredTarget.current.copy(defaultTarget.current);
            isAnimating.current = true;
            return;
        }

        const selected = pallets.find((pallet) => pallet.id === selectedPalletId);
        if (!selected) return;

        const target = calculate3DPosition(selected.logicalAddress);
        const isSplitView = !isFullscreen3D && !isListExpanded;
        const parcelFocusY = target.y + WAREHOUSE_CONFIG.PALLET_SIZE[1] * 0.5;
        // Look slightly below the parcel so it sits in the top third of the viewport.
        target.y = parcelFocusY - (isSplitView ? 2.4 : 1.4);

        const offset = isSplitView
            ? new THREE.Vector3(6.4, 9.2, 6.4)
            : new THREE.Vector3(5.2, 4.8, 5.2);
        desiredTarget.current.copy(target);
        desiredCameraPos.current.copy(target).add(offset);
        isAnimating.current = true;
    }, [selectedPalletId, pallets, controlsRef, isFullscreen3D, isListExpanded]);

    useFrame((_, delta) => {
        if (!isAnimating.current || !controlsRef.current) return;

        const alpha = 1 - Math.exp(-7 * delta);
        camera.position.lerp(desiredCameraPos.current, alpha);
        controlsRef.current.target.lerp(desiredTarget.current, alpha);
        controlsRef.current.update();

        if (
            camera.position.distanceTo(desiredCameraPos.current) < 0.05 &&
            controlsRef.current.target.distanceTo(desiredTarget.current) < 0.05
        ) {
            isAnimating.current = false;
        }
    });

    return null;
}