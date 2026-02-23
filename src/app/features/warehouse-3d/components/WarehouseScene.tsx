'use client';

import { useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { PalletInstances } from './PalletInstances';
import type { SpatialPallet } from '@/types/wms';

type HoverState = {
    pallet: SpatialPallet;
    x: number;
    y: number;
};

export const WarehouseScene = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredPallet, setHoveredPallet] = useState<HoverState | null>(null);

    const handleHoverChange = useCallback((payload: { pallet: SpatialPallet; clientX: number; clientY: number } | null) => {
        if (!payload || !containerRef.current) {
            setHoveredPallet(null);
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 250;
        const tooltipHeight = 126;
        const padding = 14;

        const localX = payload.clientX - rect.left + padding;
        const localY = payload.clientY - rect.top + padding;

        const clampedX = Math.max(padding, Math.min(localX, rect.width - tooltipWidth - padding));
        const clampedY = Math.max(padding, Math.min(localY, rect.height - tooltipHeight - padding));

        setHoveredPallet({
            pallet: payload.pallet,
            x: clampedX,
            y: clampedY,
        });
    }, []);

    const statusLabel =
        hoveredPallet?.pallet.status === 'transit'
            ? 'In Transit'
            : hoveredPallet?.pallet.status === 'stored'
                ? 'Stored'
                : 'Delayed';

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-200"
            style={{ cursor: hoveredPallet ? 'pointer' : 'default' }}
        >
            <Canvas camera={{ position: [30, 25, 30], fov: 50 }}>
                {/* 1. Atmosphäre & Licht */}
                <color attach="background" args={['#e2e8f0']} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 20, 15]} intensity={0.9} castShadow />
                {/* Environment sorgt für realistische Reflexionen */}
                <Environment preset="city" />

                {/* 2. Der Boden (Visuelles Raster) */}
                <Grid
                    position={[0, 0, 0]}
                    args={[100, 100]} // Größe
                    cellSize={4}
                    cellThickness={1}
                    cellColor="#94a3b8"
                    sectionSize={20}
                    sectionThickness={1.5}
                    sectionColor="#64748b"
                    fadeDistance={60}
                    raycast={() => null}
                />

                {/* 3. Unsere Paletten (Primitives) */}
                <PalletInstances onHoverChange={handleHoverChange} />

                {/* 4. Steuerung (Kamera drehen/zoomen) */}
                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1} // Verhindert, dass man unter den Boden schaut
                    maxDistance={80} // Nicht zu weit wegzoomen
                />
            </Canvas>

            {hoveredPallet && (
                <div
                    className="pointer-events-none absolute z-20 min-w-[250px] rounded-xl border border-white/70 bg-white/85 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-md"
                    style={{ left: hoveredPallet.x, top: hoveredPallet.y }}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <p className="font-mono text-xs font-semibold text-slate-800">{hoveredPallet.pallet.id}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {statusLabel}
                        </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700">
                        <p><span className="text-slate-500">Destination:</span> {hoveredPallet.pallet.destination}</p>
                        <p><span className="text-slate-500">Address:</span> {hoveredPallet.pallet.logicalAddress.id}</p>
                        <p><span className="text-slate-500">Weight:</span> {hoveredPallet.pallet.weightKg} kg</p>
                    </div>
                </div>
            )}
        </div>
    );
};