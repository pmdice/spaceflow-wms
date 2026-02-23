'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { calculate3DPosition } from '@/lib/warehouse-math';
import { WAREHOUSE_CONFIG } from '@/lib/constants';
import type { SpatialPallet } from '@/types/wms';

const BaseColor = new THREE.Color("#64748b"); // Deutlich sichtbarer Slate-Ton auf hellem Canvas
const HoverColor = new THREE.Color("#f59e0b");

type PalletHoverPayload = {
    pallet: SpatialPallet;
    clientX: number;
    clientY: number;
};

type PalletInstancesProps = {
    onHoverChange?: (payload: PalletHoverPayload | null) => void;
};

export const PalletInstances = ({ onHoverChange }: PalletInstancesProps) => {
    // 1. Wir holen ALLE Daten und die gefilterten Daten aus dem Store
    const allPallets = useLogisticsStore((state) => state.pallets);
    const filteredPallets = useLogisticsStore((state) => state.filteredPallets);
    const highlightColorHex = useLogisticsStore((state) => state.activeHighlightColor);
    const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null);

    // Referenz auf das InstancedMesh Objekt in Three.js
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Temporäre Helfer-Objekte, um Speicherleck zu vermeiden (werden wiederverwendet)
    const dummyMatrix = useMemo(() => new THREE.Object3D(), []);
    const highlightColor = useMemo(() => new THREE.Color(), []);

    // 2. Der Performance-Trick: Ein Set für O(1) Lookups erstellen
    // Wir müssen schnell wissen: "Ist Palette X gerade im Filter oder nicht?"
    const filteredIds = useMemo(() => {
        return new Set(filteredPallets.map(p => p.id));
    }, [filteredPallets]);

    // Neu: Wir prüfen, ob überhaupt ein Filter aktiv ist
    const isFiltered = allPallets.length !== filteredPallets.length;


    // 3. Der Render-Loop (Reagiert auf Änderungen im Store)
    useEffect(() => {
        if (!meshRef.current || allPallets.length === 0) return;

        // Wir iterieren über ALLE Paletten im Lager
        allPallets.forEach((pallet, index) => {
            // A) Position berechnen
            const position = calculate3DPosition(pallet.logicalAddress);
            dummyMatrix.position.copy(position);
            dummyMatrix.updateMatrix();

            // Die Matrix an die Grafikkarte übergeben (an den Slot 'index')
            meshRef.current!.setMatrixAt(index, dummyMatrix.matrix);

            // B) Farbe bestimmen (Das ist die Visualisierung der KI-Suche!)
            const isPartOfFilter = filteredIds.has(pallet.id);

            if (hoveredInstanceId === index) {
                meshRef.current!.setColorAt(index, HoverColor);
            } else if (isFiltered && isPartOfFilter && highlightColorHex) {
                // Wenn gefiltert UND eine Farbe von der KI kam -> KI-Farbe nutzen
                highlightColor.set(highlightColorHex);
                meshRef.current!.setColorAt(index, highlightColor);
            } else if (isFiltered && isPartOfFilter && !highlightColorHex) {
                // Wenn gefiltert, aber keine spezifische Farbe -> Standard-Blau
                highlightColor.set("#3b82f6");
                meshRef.current!.setColorAt(index, highlightColor);
            } else {
                // Nicht Teil des Filters ODER kein Filter aktiv -> Basis-Grau
                meshRef.current!.setColorAt(index, BaseColor);
            }
        });

        // WICHTIG: Three.js sagen, dass sich Matrizen und Farben geändert haben
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    }, [allPallets, filteredIds, highlightColorHex, isFiltered, hoveredInstanceId, dummyMatrix, highlightColor]);


    return (
        // Wir sagen: Wir brauchen Platz für X Instanzen
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, allPallets.length]}
            onPointerMove={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                if (event.instanceId === undefined) return;
                setHoveredInstanceId(event.instanceId);
                const pallet = allPallets[event.instanceId];
                if (!pallet) return;

                onHoverChange?.({
                    pallet,
                    clientX: event.nativeEvent.clientX,
                    clientY: event.nativeEvent.clientY,
                });
            }}
            onPointerOut={() => {
                setHoveredInstanceId(null);
                onHoverChange?.(null);
            }}
        >
            {/* DAS PRIMITIVE! Später tauschen wir das hier gegen ein GLTF Model */}
            <boxGeometry args={WAREHOUSE_CONFIG.PALLET_SIZE} />
            {/* Ein einfaches Material, das auf Licht reagiert */}
            <meshStandardMaterial roughness={0.5} metalness={0.1} />
        </instancedMesh>
    );
};