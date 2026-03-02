'use client';

import { useEffect, useMemo, useState } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import type { SpatialPallet } from '@/types/wms';
import { cn } from '@/lib/utils';

const actionButtons = [
    { key: 'scan', label: 'Scan' },
    { key: 'relocate', label: 'Relocate' },
    { key: 'pick', label: 'Pick' },
    { key: 'load', label: 'Load' },
    { key: 'putaway', label: 'Putaway' },
    { key: 'delay', label: 'Delay' },
] as const;

type SimulationSpeed = 1000 | 2500 | 5000;

export default function InventoryPage() {
    const fetchData = useLogisticsStore((state) => state.fetchData);
    const pallets = useLogisticsStore((state) => state.pallets);
    const palletEvents = useLogisticsStore((state) => state.palletEvents);
    const applyPalletAction = useLogisticsStore((state) => state.applyPalletAction);
    const isSimulationRunning = useLogisticsStore((state) => state.isSimulationRunning);
    const simulationSpeedMs = useLogisticsStore((state) => state.simulationSpeedMs);
    const startSimulation = useLogisticsStore((state) => state.startSimulation);
    const stopSimulation = useLogisticsStore((state) => state.stopSimulation);
    const setSimulationSpeed = useLogisticsStore((state) => state.setSimulationSpeed);

    const [selectedPalletId, setSelectedPalletId] = useState<string | null>(null);

    useEffect(() => {
        if (pallets.length === 0) {
            fetchData();
        }
    }, [fetchData, pallets.length]);

    const resolvedSelectedPalletId = selectedPalletId ?? pallets[0]?.id ?? null;
    const selectedPallet = useMemo(
        () => pallets.find((item) => item.id === resolvedSelectedPalletId) ?? null,
        [pallets, resolvedSelectedPalletId],
    );
    const selectedEvents = useMemo(
        () => palletEvents.filter((event) => event.palletId === resolvedSelectedPalletId).slice(0, 8),
        [palletEvents, resolvedSelectedPalletId],
    );

    return (
        <SidebarInset className="h-dvh bg-[#F4F4F5] overflow-hidden">
            <header className="flex h-16 shrink-0 items-center justify-between px-6 bg-white/75 backdrop-blur-xl border-b border-white/40">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="-ml-2 bg-white/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-white/50" />
                    <Separator orientation="vertical" className="h-4 bg-gray-300" />
                    <h1 className="text-lg font-semibold tracking-tight text-gray-900">Inventory Simulator</h1>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                        value={simulationSpeedMs}
                        onChange={(event) => setSimulationSpeed(Number(event.target.value) as SimulationSpeed)}
                    >
                        <option value={1000}>1x speed</option>
                        <option value={2500}>0.5x speed</option>
                        <option value={5000}>0.25x speed</option>
                    </select>
                    <Button
                        onClick={() => (isSimulationRunning ? stopSimulation() : startSimulation())}
                        className={cn(isSimulationRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800')}
                    >
                        {isSimulationRunning ? 'Pause Live Feed' : 'Start Live Feed'}
                    </Button>
                </div>
            </header>

            <main className="grid h-[calc(100dvh-4rem)] grid-cols-12 gap-4 p-4">
                <Card className="col-span-4 bg-white/90 border-white/70">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-700">Pallets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-auto max-h-[calc(100dvh-10rem)]">
                        {pallets.map((pallet) => (
                            <button
                                key={pallet.id}
                                className={cn(
                                    'w-full rounded-lg border px-3 py-2 text-left transition',
                                    resolvedSelectedPalletId === pallet.id
                                        ? 'border-[#BC804C] bg-[#BC804C]/10'
                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                )}
                                onClick={() => setSelectedPalletId(pallet.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-xs font-semibold">{pallet.id}</p>
                                    <StatusBadge status={pallet.status} />
                                </div>
                                <p className="mt-1 text-xs text-slate-600">{pallet.destination} - {pallet.logicalAddress.id}</p>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-4 bg-white/90 border-white/70">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-700">Action Console</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedPallet ? (
                            <>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <p className="font-semibold text-slate-900">{selectedPallet.id}</p>
                                    <p className="text-slate-600">{selectedPallet.destination} - {selectedPallet.weightKg}kg</p>
                                    <p className="text-slate-500 text-xs mt-1">Last scan: {new Date(selectedPallet.lastScannedAt).toLocaleString()}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {actionButtons.map((action) => (
                                        <Button
                                            key={action.key}
                                            variant="outline"
                                            className="justify-start"
                                            onClick={() => applyPalletAction(selectedPallet.id, action.key)}
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">No pallet selected.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-4 bg-white/90 border-white/70">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-700">Recent Events</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-auto max-h-[calc(100dvh-10rem)]">
                        {selectedEvents.map((event) => (
                            <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800">{event.type.replace('_', ' ')}</span>
                                    <span className="text-slate-500">{new Date(event.at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-500 mt-1">{event.actor} via {event.source}</p>
                            </div>
                        ))}
                        {selectedEvents.length === 0 && <p className="text-sm text-slate-500">No events yet.</p>}
                    </CardContent>
                </Card>
            </main>
        </SidebarInset>
    );
}

function StatusBadge({ status }: { status: SpatialPallet['status'] }) {
    if (status === 'delayed') return <Badge className="bg-[#BC804C] text-white">Delayed</Badge>;
    if (status === 'transit') return <Badge variant="outline">Transit</Badge>;
    return <Badge variant="secondary">Stored</Badge>;
}
