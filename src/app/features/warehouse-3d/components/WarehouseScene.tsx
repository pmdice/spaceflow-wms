'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { PalletInstances } from './PalletInstances';

export const WarehouseScene = () => {
    return (
        <div className="h-full w-full rounded-2xl overflow-hidden bg-slate-200">
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
                />

                {/* 3. Unsere Paletten (Primitives) */}
                <PalletInstances />

                {/* 4. Steuerung (Kamera drehen/zoomen) */}
                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1} // Verhindert, dass man unter den Boden schaut
                    maxDistance={80} // Nicht zu weit wegzoomen
                />
            </Canvas>
        </div>
    );
};