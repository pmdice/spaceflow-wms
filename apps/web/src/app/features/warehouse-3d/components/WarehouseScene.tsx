'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
    splitPanelHeightRatio?: number;
};

export const WarehouseScene = ({ isFullscreen3D = false, isListExpanded = false, splitPanelHeightRatio = 0.48 }: WarehouseSceneProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);
    const selectedPalletId = useLogisticsStore((state) => state.selectedPalletId);
    const filteredPallets = useLogisticsStore((state) => state.filteredPallets);
    const filterRevision = useLogisticsStore((state) => state.filterRevision);

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
                <PalletInstances onHoverInfoChange={handleHoverInfoChange} />
                <CameraFocusController
                    selectedPalletId={selectedPalletId}
                    pallets={filteredPallets}
                    controlsRef={controlsRef}
                    isFullscreen3D={isFullscreen3D}
                    isListExpanded={isListExpanded}
                    filterRevision={filterRevision}
                    splitPanelHeightRatio={splitPanelHeightRatio}
                />

                {/* Camera controls */}
                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    maxDistance={120}
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
    filterRevision,
    splitPanelHeightRatio,
}: {
    selectedPalletId: string | null;
    pallets: SpatialPallet[];
    controlsRef: React.RefObject<OrbitControlsImpl | null>;
    isFullscreen3D: boolean;
    isListExpanded: boolean;
    filterRevision: number;
    splitPanelHeightRatio: number;
}) {
    const { camera, size } = useThree();
    const desiredCameraPos = useRef(new THREE.Vector3());
    const desiredTarget = useRef(new THREE.Vector3());
    const defaultCameraPos = useRef(new THREE.Vector3());
    const defaultTarget = useRef(new THREE.Vector3());
    const lastHandledFilterRevision = useRef<number>(-1);
    const prevSelectedPalletId = useRef<string | null>(null);
    const hasOverviewFrame = useRef(false);
    const hasDefaults = useRef(false);
    const isAnimating = useRef(false);
    const animationProgress = useRef(1);
    const animationDuration = 1.1;
    const startCameraPos = useRef(new THREE.Vector3());
    const startTarget = useRef(new THREE.Vector3());

    const startAnimation = useCallback(() => {
        if (!controlsRef.current) return;
        startCameraPos.current.copy(camera.position);
        startTarget.current.copy(controlsRef.current.target);
        animationProgress.current = 0;
        isAnimating.current = true;
        controlsRef.current.enableDamping = false;
    }, [camera, controlsRef]);

    const applyOverviewFrame = useCallback((animate: boolean) => {
        if (pallets.length === 0 || !controlsRef.current) return false;

        const bounds = new THREE.Box3();
        pallets.forEach((pallet) => {
            const pos = calculate3DPosition(pallet.logicalAddress);
            const y = pos.y + (WAREHOUSE_CONFIG.PALLET_SIZE[1] / 2);
            bounds.expandByPoint(new THREE.Vector3(pos.x, y, pos.z));
        });

        const center = bounds.getCenter(new THREE.Vector3());
        const boundsSize = bounds.getSize(new THREE.Vector3());
        const radius = Math.max(boundsSize.x, boundsSize.z, boundsSize.y) * 0.58;
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        const fitDistance = Math.max(4, (radius / Math.tan(fov / 2)) * 1);
        const isSplitView = !isFullscreen3D && !isListExpanded;
        const fitOffset = isSplitView
            ? new THREE.Vector3(fitDistance * 0.95, fitDistance * 1.06, fitDistance * 0.95)
            : new THREE.Vector3(fitDistance * 0.78, fitDistance * 0.78, fitDistance * 0.78);

        const overviewTarget = center.clone();
        if (isSplitView) {
            overviewTarget.y = solveTargetYForTopThird({
                camera,
                cameraPosition: center.clone().add(fitOffset),
                baseTarget: overviewTarget,
                focusPoint: center,
                viewportWidth: size.width,
                viewportHeight: size.height,
                panelHeightRatio: splitPanelHeightRatio,
                headerHeightPx: 64,
                maxTargetShift: Math.max(2.8, boundsSize.y * 1.25 + 2.2),
            });
        } else {
            overviewTarget.y += 0.3;
        }
        const overviewCamera = overviewTarget.clone().add(fitOffset);

        defaultTarget.current.copy(overviewTarget);
        defaultCameraPos.current.copy(overviewCamera);
        desiredTarget.current.copy(overviewTarget);
        desiredCameraPos.current.copy(overviewCamera);

        if (animate) {
            startAnimation();
        } else {
            camera.position.copy(overviewCamera);
            controlsRef.current.target.copy(overviewTarget);
            controlsRef.current.update();
        }
        hasOverviewFrame.current = true;
        return true;
    }, [
        pallets,
        controlsRef,
        camera,
        isFullscreen3D,
        isListExpanded,
        size.width,
        size.height,
        splitPanelHeightRatio,
        startAnimation,
    ]);

    useEffect(() => {
        if (!controlsRef.current) return;

        if (!hasDefaults.current) {
            const initialized = applyOverviewFrame(false);
            if (!initialized) {
                defaultCameraPos.current.copy(camera.position);
                defaultTarget.current.copy(controlsRef.current.target);
                desiredCameraPos.current.copy(camera.position);
                desiredTarget.current.copy(controlsRef.current.target);
            }
            lastHandledFilterRevision.current = filterRevision;
            hasDefaults.current = true;
        }

        if (!selectedPalletId) {
            if (!hasOverviewFrame.current && pallets.length > 0) {
                applyOverviewFrame(false);
                prevSelectedPalletId.current = selectedPalletId;
                return;
            }

            if (filterRevision !== lastHandledFilterRevision.current) {
                applyOverviewFrame(true);
                lastHandledFilterRevision.current = filterRevision;
                prevSelectedPalletId.current = selectedPalletId;
                return;
            }

            if (prevSelectedPalletId.current !== null) {
                // Detail close / deselect: go directly back to stored default overview.
                desiredCameraPos.current.copy(defaultCameraPos.current);
                desiredTarget.current.copy(defaultTarget.current);
                startAnimation();
            }
            prevSelectedPalletId.current = selectedPalletId;
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
        startAnimation();
        prevSelectedPalletId.current = selectedPalletId;
    }, [
        selectedPalletId,
        pallets,
        controlsRef,
        isFullscreen3D,
        isListExpanded,
        filterRevision,
        camera,
        size,
        splitPanelHeightRatio,
        applyOverviewFrame,
        startAnimation,
    ]);

    useFrame((_, delta) => {
        if (!isAnimating.current || !controlsRef.current) return;

        animationProgress.current = Math.min(1, animationProgress.current + (delta / animationDuration));
        const t = animationProgress.current;
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        camera.position.lerpVectors(startCameraPos.current, desiredCameraPos.current, eased);
        controlsRef.current.target.lerpVectors(startTarget.current, desiredTarget.current, eased);
        controlsRef.current.update();

        if (animationProgress.current >= 1) {
            camera.position.copy(desiredCameraPos.current);
            controlsRef.current.target.copy(desiredTarget.current);
            controlsRef.current.enableDamping = true;
            controlsRef.current.update();
            isAnimating.current = false;
        }
    });

    return null;
}

function ZoneBands() {
    const zoneColors: Record<string, string> = {
        A: '#dbeafe',
        B: '#dcfce7',
        C: '#fef3c7',
    };

    return (
        <group>
            {WAREHOUSE_CONFIG.ZONES.map((zone) => {
                const left = calculate3DPosition({ id: '', zone, aisle: 1, bay: 1, level: 1 });
                const right = calculate3DPosition({ id: '', zone, aisle: WAREHOUSE_CONFIG.AISLE_COUNT, bay: 1, level: 1 });
                const front = calculate3DPosition({ id: '', zone, aisle: 1, bay: 1, level: 1 });
                const back = calculate3DPosition({ id: '', zone, aisle: 1, bay: WAREHOUSE_CONFIG.BAYS_PER_AISLE, level: 1 });

                const width = Math.abs(right.x - left.x) + (WAREHOUSE_CONFIG.AISLE_WIDTH + WAREHOUSE_CONFIG.SHELF_SIZE[2]);
                const depth = Math.abs(back.z - front.z) + WAREHOUSE_CONFIG.BAY_WIDTH;
                const centerX = (left.x + right.x) / 2;
                const centerZ = (front.z + back.z) / 2;

                return (
                    <mesh key={zone} position={[centerX, -0.08, centerZ]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
                        <planeGeometry args={[width, depth]} />
                        <meshBasicMaterial color={zoneColors[zone] ?? '#e2e8f0'} transparent opacity={0.22} />
                    </mesh>
                );
            })}
        </group>
    );
}

function solveTargetYForTopThird({
    camera,
    cameraPosition,
    baseTarget,
    focusPoint,
    viewportWidth,
    viewportHeight,
    panelHeightRatio,
    headerHeightPx,
    maxTargetShift,
}: {
    camera: THREE.Camera;
    cameraPosition: THREE.Vector3;
    baseTarget: THREE.Vector3;
    focusPoint: THREE.Vector3;
    viewportWidth: number;
    viewportHeight: number;
    panelHeightRatio: number;
    headerHeightPx: number;
    maxTargetShift: number;
}) {
    const perspective = camera as THREE.PerspectiveCamera;
    const testCam = perspective.clone();
    testCam.position.copy(cameraPosition);
    testCam.aspect = viewportWidth / Math.max(1, viewportHeight);
    testCam.updateProjectionMatrix();

    const panelPx = viewportHeight * panelHeightRatio;
    const visibleTop = headerHeightPx;
    const visibleBottom = Math.max(visibleTop + 40, viewportHeight - panelPx);
    const visibleHeight = visibleBottom - visibleTop;
    const desiredScreenY = visibleTop + (visibleHeight / 3);

    const projectY = (targetY: number) => {
        const lookTarget = new THREE.Vector3(baseTarget.x, targetY, baseTarget.z);
        testCam.lookAt(lookTarget);
        testCam.updateMatrixWorld(true);
        const projected = focusPoint.clone().project(testCam);
        return ((1 - projected.y) / 2) * viewportHeight;
    };

    let currentY = baseTarget.y;
    for (let i = 0; i < 8; i++) {
        const y0 = projectY(currentY);
        const error = y0 - desiredScreenY;
        if (Math.abs(error) < 1.5) break;

        const eps = 0.25;
        const y1 = projectY(currentY + eps);
        const slope = (y1 - y0) / eps;
        if (Math.abs(slope) < 1e-4) break;

        currentY = currentY - (error / slope);
        currentY = THREE.MathUtils.clamp(
            currentY,
            baseTarget.y - maxTargetShift,
            baseTarget.y + maxTargetShift
        );
    }

    return THREE.MathUtils.clamp(
        currentY,
        baseTarget.y - maxTargetShift,
        baseTarget.y + maxTargetShift
    );
}