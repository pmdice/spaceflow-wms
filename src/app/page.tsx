'use client';

import { useEffect, useState } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { MagicSearchbar } from '@/app/features/ai-search/components/MagicSearchbar';
import { LogisticsTable } from '@/app/features/logistics-table/components/LogisticsTable';
import { WarehouseScene } from '@/app/features/warehouse-3d/components/WarehouseScene';
import { ParcelDetailPanel } from '@/app/features/parcel-detail/components/ParcelDetailPanel';
import {
    Box,
    Activity,
    Maximize,
    Minimize,
    PackageCheck,
    Github,
    ExternalLink,
    type LucideIcon,
} from 'lucide-react';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const BASE_LIST_PANEL_HEIGHT_DVH = 48;
const REPOSITORY_URL = 'https://github.com/pmdice/spaceflow-wms';

export default function DashboardPage() {
    const fetchData = useLogisticsStore((state) => state.fetchData);
    const error = useLogisticsStore((state) => state.error);

    const pallets = useLogisticsStore((state) => state.filteredPallets);
    const allPallets = useLogisticsStore((state) => state.pallets);
    const totalPallets = useLogisticsStore((state) => state.pallets.length);
    const filteredCount = pallets.length;
    const selectedPalletId = useLogisticsStore((state) => state.selectedPalletId);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);

    const delayedCount = pallets.filter(p => p.status === 'delayed').length;
    const selectedPallet = allPallets.find((p) => p.id === selectedPalletId) ?? null;

    const [is3DInteractive, setIs3DInteractive] = useState(false);
    const [isListExpanded, setIsListExpanded] = useState(false);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleListExpanded = () => {
        setIsListExpanded((prev) => !prev);
        setIs3DInteractive(false);
    };

    const enter3DMode = () => {
        setIsListExpanded(false);
        setIs3DInteractive(true);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6">
                <Card className="max-w-md w-full p-8 rounded-[2rem] shadow-xl text-center border-none">
                    <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Activity className="size-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">System Error</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
                        Reconnect
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <SidebarInset className="relative h-dvh bg-[#F4F4F5] overflow-hidden font-sans flex flex-col">
            <div className={cn(
                "absolute inset-0 z-0 transition-opacity duration-700 ease-in-out",
                is3DInteractive ? "pointer-events-auto opacity-100" : "pointer-events-auto opacity-80"
            )}>
                <WarehouseScene
                    isFullscreen3D={is3DInteractive}
                    isListExpanded={isListExpanded}
                    splitPanelHeightRatio={BASE_LIST_PANEL_HEIGHT_DVH / 100}
                />
            </div>

            <div className="relative z-10 flex flex-col h-full overflow-hidden pointer-events-none">

                <header className={cn(
                    "relative flex h-16 shrink-0 items-center justify-between px-6 pointer-events-auto bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm z-20 transition-all duration-500",
                    is3DInteractive ? "translate-y-[-100%] opacity-0" : "translate-y-0 opacity-100"
                )}>
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-2 bg-white/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-white/50" />
                        <Separator orientation="vertical" className="h-4 bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <Box className="size-5 text-[#BC804C]" />
                            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                                SpaceFlow <span className="font-light text-gray-500 ml-1">| Terminal A</span>
                            </h1>
                        </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-2 bg-gray-900/88 text-white hover:bg-gray-900 border border-white/10 backdrop-blur-md shadow-[0_12px_28px_rgba(15,23,42,0.28)]"
                        >
                            <a
                                href={REPOSITORY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open project repository on GitHub"
                                title="View project repository"
                            >
                                <Github className="size-4" />
                                <span className="text-xs font-semibold tracking-wide">View Code</span>
                                <ExternalLink className="size-3.5 opacity-80" />
                            </a>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <HeaderKPIChip
                            label="Active Volume"
                            value={`${filteredCount} / ${totalPallets}`}
                            icon={PackageCheck}
                        />
                        <HeaderKPIChip
                            label="Delayed"
                            value={delayedCount}
                            icon={Activity}
                            alert={delayedCount > 0}
                        />
                    </div>
                </header>

                <div className={cn(
                    "absolute top-20 right-6 pointer-events-auto transition-all duration-500 ease-in-out z-30",
                    is3DInteractive ? "opacity-0 translate-y-[-10px] scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"
                )}>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleListExpanded}
                            className="h-9 bg-white/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-white/60 backdrop-blur-md shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                        >
                            {isListExpanded ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
                            {isListExpanded ? "Base layout" : "Full list"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={enter3DMode}
                            className={cn(
                                "bg-white/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-white/60 backdrop-blur-md shadow-[0_8px_24px_rgba(15,23,42,0.12)]",
                                isListExpanded ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                            )}
                            aria-label="Enter fullscreen 3D mode"
                            title="Fullscreen 3D view"
                        >
                            <Maximize className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className={cn(
                    "absolute top-8 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-500 ease-in-out z-30",
                    is3DInteractive ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-[-20px] scale-95 pointer-events-none"
                )}>
                    <button
                        onClick={() => setIs3DInteractive(false)}
                        className="flex items-center gap-2.5 bg-gray-900/90 hover:bg-gray-900 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all border border-white/10"
                    >
                        <Minimize className="size-3.5" />
                        Exit 3D Model
                    </button>
                </div>

                {/* Floating searchbar in overlay layer for reliable backdrop blur */}
                <div
                    className={cn(
                        "absolute left-1/2 z-30 w-full max-w-xl -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] px-4 md:px-0 pointer-events-auto transition-all duration-500 ease-in-out",
                        is3DInteractive ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                    )}
                    style={{ top: isListExpanded ? "4rem" : `${100 - BASE_LIST_PANEL_HEIGHT_DVH}dvh` }}
                >
                    <MagicSearchbar />
                </div>

                <ParcelDetailPanel
                    pallet={selectedPallet}
                    onClose={() => setSelectedPalletId(null)}
                />

                <div className="flex-1" />

                <div className={cn(
                    "pointer-events-auto w-full shrink-0 transition-[height,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    is3DInteractive ? "translate-y-full" : "translate-y-0"
                )}
                style={{ height: isListExpanded ? "calc(100dvh - 4rem)" : `${BASE_LIST_PANEL_HEIGHT_DVH}dvh` }}>
                    <Card className="bg-white/90 backdrop-blur-2xl border-t border-white/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-none h-full flex flex-col py-0 gap-0">
                        <CardContent className="p-0 overflow-hidden flex-1 relative">
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                            <LogisticsTable />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </SidebarInset>
    );
}

function HeaderKPIChip({ label, value, icon: Icon, alert = false }: { label: string, value: string | number, icon: LucideIcon, alert?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-md",
            "shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
            alert ? "bg-red-50/90 border-red-200/80" : "bg-white/80 border-slate-200/80"
        )}>
            <Icon className={cn("size-3.5", alert ? "text-red-600" : "text-[#BC804C]")} />
            <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                <span className={cn("text-sm font-semibold leading-none", alert ? "text-red-600" : "text-slate-900")}>
                    {value}
                </span>
            </div>
        </div>
    );
}