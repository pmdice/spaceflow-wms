'use client';

import { useEffect } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { MagicSearchbar } from '@/app/features/ai-search/components/MagicSearchbar';
import { LogisticsTable } from '@/app/features/logistics-table/components/LogisticsTable';
import { WarehouseScene } from '@/app/features/warehouse-3d/components/WarehouseScene';
import {
    Box,
    Settings,
    Bell,
    User,
    ChevronLeft,
    Grid,
    Map as MapIcon,
    Zap,
    UserCheck,
    Package,
    Activity,
    Calendar,
    Moon,
    Sun,
    SlidersHorizontal,
    ChevronDown,
    ArrowUpRight,
    Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const fetchData = useLogisticsStore((state) => state.fetchData);
    const isLoading = useLogisticsStore((state) => state.isLoading);
    const error = useLogisticsStore((state) => state.error);

    const pallets = useLogisticsStore((state) => state.filteredPallets);
    const filteredCount = pallets.length;

    // --- NEW: 3D Interaction State ---
    const [is3DInteractive, setIs3DInteractive] = useState(false);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E5E5E5] p-6">
                <div className="max-w-md w-full bg-[#F0F0F0] p-8 rounded-[2rem] shadow-xl border border-[#D1D1D1] text-center">
                    <div className="w-16 h-16 bg-[#BC804C]/10 text-[#BC804C] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Box className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">System Error</h2>
                    <p className="text-[#666666] mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full py-3 bg-[#BC804C] text-white rounded-xl font-bold hover:bg-[#8B5E34] transition-all">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        // Root Container
        <div className="relative w-full h-screen overflow-hidden bg-[#E5E5E5] text-[#2D2D2D] font-sans">

            {/* --- 1. LAYER: 3D BACKGROUND --- */}
            {/* We control pointer-events based on the is3DInteractive state */}
            <div className={cn(
                "absolute inset-0 z-0 transition-opacity duration-700 ease-in-out",
                is3DInteractive ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-80"
            )}>
                <WarehouseScene />
            </div>

            {/* 2. LAYER: UI OVERLAY */}
            {/* pointer-events-none erlaubt das Klicken/Ziehen auf das 3D-Canvas durch leere Räume hindurch */}
            <div className="absolute inset-0 z-10 flex pointer-events-none">

                {/* Sidebar */}
                <aside className="w-16 lg:w-20 bg-[#F5F5F5]/90 backdrop-blur-md border-r border-white/50 flex flex-col items-center py-8 gap-8 pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="mb-4">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Box className="w-6 h-6 text-[#2D2D2D]" />
                        </div>
                    </div>

                    <nav className="flex flex-col gap-6">
                        <SidebarIcon icon={ChevronLeft} />
                        <SidebarIcon icon={Grid} active />
                        <SidebarIcon icon={Activity} />
                        <SidebarIcon icon={Zap} />
                        <SidebarIcon icon={UserCheck} />
                        <SidebarIcon icon={Package} />
                        <SidebarIcon icon={MapIcon} />
                        <SidebarIcon icon={Calendar} />
                        <SidebarIcon icon={Settings} />
                    </nav>

                    <div className="mt-auto flex flex-col gap-4">
                        <SidebarIcon icon={Moon} />
                        <SidebarIcon icon={Sun} active />
                    </div>
                </aside>

                {/* Main Content Area (Scrollable if needed) */}
                <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6">

                    {/* Header */}
                    <header className="flex items-center justify-between mb-8 pointer-events-auto">
                        <div className="flex items-center gap-12">
                            <h1 className="text-3xl font-medium tracking-tight bg-white/50 px-4 py-1 rounded-xl backdrop-blur-sm">SpaceFlow</h1>

                            <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-xl border border-white/50 shadow-sm">
                                <Tab label="Map" />
                                <Tab label="Dashboard" active />
                                <Tab label="Flow" />
                                <Tab label="Buildings" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <HeaderAction icon={Bell} />
                            <HeaderAction icon={Settings} />
                            <HeaderAction icon={SlidersHorizontal} />
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ml-2 bg-white">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Patrick" alt="User" />
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


                </main>
            </div>
        </div>
    );
}

// --- Hilfskomponenten (Sub-components) ---

function SidebarIcon({ icon: Icon, active = false }: { icon: any, active?: boolean }) {
    return (
        <button className={cn(
            "p-3 rounded-xl transition-all duration-300 relative group",
            active ? "bg-[#BC804C] text-white shadow-lg shadow-[#BC804C]/30" : "text-[#666666] hover:bg-white/80 hover:shadow-sm"
        )}>
            <Icon className="w-5 h-5" />
        </button>
    );
}

function Tab({ label, active = false }: { label: string, active?: boolean }) {
    return (
        <button className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            active ? "bg-[#BC804C] text-white shadow-md shadow-[#BC804C]/20" : "text-[#666666] hover:bg-white"
        )}>
            {label}
        </button>
    );
}

function HeaderAction({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-2.5 bg-white/60 backdrop-blur-md rounded-xl hover:bg-white shadow-sm border border-white/50 transition-colors">
            <Icon className="w-5 h-5 text-[#666666]" />
        </button>
    );
}

function BreadcrumbItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[#666666]">{label}:</span>
            <span className="text-[#2D2D2D] font-medium flex items-center gap-1 cursor-pointer hover:text-[#BC804C] transition-colors">
        {value} <ChevronDown className="w-3 h-3" />
      </span>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, slider = false }: any) {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{title}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#666666]" />
            </div>
            <div className="text-5xl font-light mb-8 text-center">{value}</div>

            {slider && (
                <div className="px-4">
                    <div className="h-1.5 bg-[#E5E5E5] rounded-full relative">
                        <div className="absolute top-1/2 left-[40%] -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-[#BC804C] rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"></div>
                    </div>
                    <div className="flex justify-between mt-3 text-[9px] font-bold text-[#666666] uppercase tracking-wider">
                        <span>Low</span>
                        <span>Avg</span>
                        <span>High</span>
                    </div>
                </div>
            )}
        </div>
    );
}