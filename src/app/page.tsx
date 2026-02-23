'use client';

import { useEffect, useState } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { MagicSearchbar } from '@/app/features/ai-search/components/MagicSearchbar';
import { LogisticsTable } from '@/app/features/logistics-table/components/LogisticsTable';
import { WarehouseScene } from '@/app/features/warehouse-3d/components/WarehouseScene';
import {
    Box,
    Activity,
    Minimize,
    MousePointer2,
    PackageCheck,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Ensure this is installed via shadcn
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const fetchData = useLogisticsStore((state) => state.fetchData);
    const error = useLogisticsStore((state) => state.error);

    const pallets = useLogisticsStore((state) => state.filteredPallets);
    const totalPallets = useLogisticsStore((state) => state.pallets.length);
    const filteredCount = pallets.length;

    const delayedCount = pallets.filter(p => p.status === 'delayed').length;
    const transitCount = pallets.filter(p => p.status === 'transit').length;

    // --- NEW: 3D Interaction State ---
    const [is3DInteractive, setIs3DInteractive] = useState(false);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        <SidebarInset className="relative h-screen bg-[#F4F4F5] overflow-hidden font-sans flex flex-col">

            {/* --- 1. LAYER: 3D BACKGROUND --- */}
            {/* We control pointer-events based on the is3DInteractive state */}
            <div className={cn(
                "absolute inset-0 z-0 transition-opacity duration-700 ease-in-out",
                is3DInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-80"
            )}>
                <WarehouseScene />
            </div>

            {/* --- 2. LAYER: UI OVERLAY --- */}
            <div className="relative z-10 flex flex-col h-full overflow-hidden pointer-events-none">

                {/* --- HEADER (Edge to Edge) --- */}
                <header className={cn(
                    "flex h-16 shrink-0 items-center justify-between px-6 pointer-events-auto bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm z-20 transition-all duration-500",
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

                {/* --- FLOATING CONTROLS --- */}
                <div className={cn(
                    "flex-1 p-6 flex flex-col justify-end transition-all duration-500 ease-in-out",
                    is3DInteractive ? "opacity-0 translate-y-[-20px]" : "opacity-100 translate-y-0"
                )}>
                    {/* INTERACT 3D BUTTON (Redesigned with Ghost style) */}
                    <div className="flex justify-center mb-8 pointer-events-auto">
                        <Button
                            variant="ghost"
                            onClick={() => setIs3DInteractive(true)}
                            className="group"
                        >
                            <MousePointer2 className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                            Interact with 3D Model
                        </Button>
                    </div>
                </div>

    {/* --- EXIT 3D MODE BUTTON (Only visible when interactive) --- */}
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

                {/* --- BOTTOM DATA PANEL (Edge to Edge Drawer) --- */}
                {/* It slides down out of view when 3D mode is active */}
                <div className={cn(
                    "pointer-events-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    is3DInteractive ? "translate-y-full" : "translate-y-0"
                )}>
                    <Card className="bg-white/90 backdrop-blur-2xl border-t border-white/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-none h-[45vh] flex flex-col">

                        {/* Panel Header: Optimised & Modernized */}
                        <CardHeader className="border-b bg-white/40 backdrop-blur-md py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6 sticky top-0 z-20">

                            {/* Left: Titles & Tags */}
                            <div className="flex flex-col gap-1.5 min-w-[200px]">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-xl font-bold tracking-tight">Inventory Roster</CardTitle>
                                    {filteredCount < totalPallets && (
                                        <Badge variant="secondary" className="bg-[#BC804C]/10 text-[#BC804C] hover:bg-[#BC804C]/20 border-none animate-in fade-in zoom-in duration-300">
                                            AI Filter Active
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-1.5 rounded-full bg-blue-500" />
                                        <span className="text-xs font-medium text-muted-foreground">Transit: {transitCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-1.5 rounded-full bg-[#BC804C]" />
                                        <span className="text-xs font-medium text-muted-foreground">Delayed: {delayedCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Center: The Magic Searchbar - Now Centered and Modernized! */}
                            <div className="flex-1 max-w-xl w-full">
                                <MagicSearchbar />
                            </div>

                            {/* Right: Action Buttons / Stats (Balance) */}
                            <div className="hidden lg:flex items-center gap-2 min-w-[200px] justify-end">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Pallets</p>
                                    <p className="text-sm font-bold text-gray-900">{filteredCount} <span className="text-gray-400 font-normal">showing</span></p>
                                </div>
                            </div>

                        </CardHeader>

                        {/* Panel Body: The Virtualized Table */}
                        <CardContent className="p-0 overflow-hidden flex-1 relative">
                            {/* Gradient mask for smooth scroll appearance */}
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                            <LogisticsTable />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </SidebarInset>
    );
}

function HeaderKPIChip({ label, value, icon: Icon, alert = false }: { label: string, value: string | number, icon: any, alert?: boolean }) {
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