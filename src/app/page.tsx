'use client';

import { useEffect, useState } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { MagicSearchbar } from '@/app/features/ai-search/components/MagicSearchbar';
import { LogisticsTable } from '@/app/features/logistics-table/components/LogisticsTable';
import { WarehouseScene } from '@/app/features/warehouse-3d/components/WarehouseScene';
import {
    Box,
    Settings,
    Bell,
    Map as MapIcon,
    Zap,
    Activity,
    ChevronDown,
    Maximize,
    Minimize,
    MousePointer2,
    PackageCheck
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Ensure this is installed via shadcn
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const fetchData = useLogisticsStore((state) => state.fetchData);
    const isLoading = useLogisticsStore((state) => state.isLoading);
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
                <header className="flex h-16 shrink-0 items-center justify-between px-6 pointer-events-auto bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm z-20 transition-transform duration-500">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-2 bg-white/60 hover:bg-white border-white/50" />
                        <Separator orientation="vertical" className="h-4 bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <Box className="size-5 text-[#BC804C]" />
                            <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                                SpaceFlow <span className="font-light text-gray-500 ml-1">| Terminal A</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex bg-gray-100/50 p-1 rounded-lg border border-white shadow-inner">
                            <Tab label="Dashboard" active />
                            <Tab label="Map View" icon={MapIcon} />
                        </div>
                        <Separator orientation="vertical" className="h-4 bg-gray-300 hidden md:block" />
                        <HeaderAction icon={Bell} badge={delayedCount > 0} />
                        <HeaderAction icon={Settings} />
                        <div className="size-8 rounded-full overflow-hidden border-2 border-white shadow-sm ml-2 bg-white cursor-pointer hover:scale-105 transition-transform">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick" alt="Operator" />
                        </div>
                    </div>
                </header>

                {/* --- FLOATING CONTROLS & KPIs --- */}
                <div className={cn(
                    "flex-1 p-6 flex flex-col justify-between transition-all duration-500 ease-in-out",
                    is3DInteractive ? "opacity-0 translate-y-[-20px]" : "opacity-100 translate-y-0"
                )}>
                    {/* Top Floating KPIs */}
                    <div className="flex gap-4 pointer-events-auto">
                        <FloatingKPI title="Active Volume" value={`${filteredCount} / ${totalPallets}`} icon={PackageCheck} />
                        <FloatingKPI title="Delayed" value={delayedCount} icon={Activity} alert={delayedCount > 0} />
                    </div>

                    {/* 3D Interaction Trigger */}
                    <div className="self-center mb-8 pointer-events-auto">
                        <button
                            onClick={() => setIs3DInteractive(true)}
                            className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-white/50 text-sm font-semibold text-gray-800 hover:scale-105 hover:bg-white transition-all group"
                        >
                            <MousePointer2 className="size-4 text-[#BC804C] group-hover:rotate-12 transition-transform" />
                            Interact with 3D Model
                        </button>
                    </div>
                </div>

                {/* --- EXIT 3D MODE BUTTON (Only visible when interactive) --- */}
                <div className={cn(
                    "absolute top-24 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-500 ease-in-out",
                    is3DInteractive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-20px] pointer-events-none"
                )}>
                    <button
                        onClick={() => setIs3DInteractive(false)}
                        className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl text-sm font-semibold text-white hover:bg-gray-900 hover:scale-105 transition-all"
                    >
                        <Minimize className="size-4" />
                        Exit 3D Mode
                    </button>
                </div>

                {/* --- BOTTOM DATA PANEL (Edge to Edge Drawer) --- */}
                {/* It slides down out of view when 3D mode is active */}
                <div className={cn(
                    "pointer-events-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    is3DInteractive ? "translate-y-full" : "translate-y-0"
                )}>
                    <Card className="bg-white/90 backdrop-blur-2xl border-t border-white/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-none h-[45vh] flex flex-col">

                        {/* Panel Header: Contains Title & AI Search */}
                        <CardHeader className="border-b bg-white/50 py-4 px-6 flex flex-row items-center justify-between sticky top-0 z-20">

                            {/* Left: Titles & Tags */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-xl">Inventory Roster</CardTitle>
                                    <Badge variant="secondary" className="bg-[#BC804C]/10 text-[#BC804C] hover:bg-[#BC804C]/20 border-none">
                                        AI Filter Active
                                    </Badge>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                        Transit: {transitCount}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                        Delayed: {delayedCount}
                                    </Badge>
                                </div>
                            </div>

                            {/* Right: The Magic Searchbar moved here! */}
                            <div className="w-[450px]">
                                <MagicSearchbar />
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

// --- Micro-Components ---

function Tab({ label, icon: Icon, active = false }: { label: string, icon?: any, active?: boolean }) {
    return (
        <button className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2",
            active ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-500 hover:text-gray-900"
        )}>
            {Icon && <Icon className="size-4" />}
            {label}
        </button>
    );
}

function HeaderAction({ icon: Icon, badge = false }: { icon: any, badge?: boolean }) {
    return (
        <button className="p-2 bg-transparent rounded-lg hover:bg-gray-100 transition-colors relative group">
            <Icon className="size-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
            {badge && (
                <span className="absolute top-1 right-1 size-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
        </button>
    );
}

function FloatingKPI({ title, value, icon: Icon, alert = false }: { title: string, value: string | number, icon: any, alert?: boolean }) {
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg rounded-2xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className={cn(
                "p-3 rounded-xl",
                alert ? "bg-red-100 text-red-600" : "bg-[#BC804C]/10 text-[#BC804C]"
            )}>
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
                <p className={cn("text-2xl font-bold", alert ? "text-red-600" : "text-gray-900")}>{value}</p>
            </div>
        </div>
    );
}