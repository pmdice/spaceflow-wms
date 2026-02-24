'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { PalletInstances } from './PalletInstances';
import { ShelfInstances } from './ShelfInstances';
import type { SpatialPallet } from '@/types/wms';
import { useLogisticsStore } from '@/store/useLogisticsStore';

type HoverInfo = {
    pallet: SpatialPallet;
    x: number;
    y: number;
};

export const WarehouseScene = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);

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

                {/* 5. Steuerung */}
                <OrbitControls
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