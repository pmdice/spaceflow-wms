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

            {/* 1. LAYER: 3D BACKGROUND (Fixed in background) */}
            <div className="absolute inset-0 z-0">
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

                    {/* Subheader */}
                    <div className="flex items-center justify-between mb-8 pointer-events-auto">
                        <div className="flex items-center gap-4">
                            <button className="p-2 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl shadow-sm transition-colors border border-white/50">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-4xl font-light text-gray-900 drop-shadow-sm">Logistics Flow</h2>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-[#666666] bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
                            <BreadcrumbItem label="Zone" value="Terminal A" />
                            <BreadcrumbItem label="Location" value="Zürich" />
                            <BreadcrumbItem label="Data range" value="This week" />
                        </div>
                    </div>

                    {/* Floating Grid Layout */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-6">

                        {/* LEFT COLUMN */}
                        <div className="w-full lg:w-[320px] flex flex-col gap-6 pointer-events-auto shrink-0">
                            {/* Magic Searchbar (Elegant in die linke Spalte integriert) */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-2 border border-white/60 shadow-lg">
                                <MagicSearchbar />
                            </div>

                            <MetricCard
                                title="Total Pallets"
                                value={filteredCount.toString()}
                                icon={Package}
                                slider={true}
                            />
                            <MetricCard
                                title="Delayed Shipments"
                                value={pallets.filter(p => p.status === 'delayed').length.toString()}
                                icon={Activity}
                                slider={true}
                            />
                        </div>

                        {/* CENTER COLUMN (Empty Space for 3D Viewer) */}
                        <div className="flex-1 flex flex-col justify-end gap-6 pointer-events-none min-h-[400px]">
                            {/* Hier ist der 3D Hintergrund sichtbar! Wir platzieren nur die breiten Karten unten */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pointer-events-auto mt-auto">
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-sm font-medium">Terminal Occupancy</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between flex-1">
                                        <div className="relative w-28 h-28 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E5E5" strokeWidth="8" />
                                                <circle cx="56" cy="56" r="48" fill="none" stroke="#BC804C" strokeWidth="8" strokeDasharray="300" strokeDashoffset="80" strokeLinecap="round" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold">85%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 text-right">
                                            <div className="text-xs text-[#666666]">In Transit: <span className="font-bold text-gray-900 ml-2">{pallets.filter(p => p.status === 'transit').length}</span></div>
                                            <div className="text-xs text-[#666666]">Stored: <span className="font-bold text-gray-900 ml-2">{pallets.filter(p => p.status === 'stored').length}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            <span className="text-sm font-medium">AI Analysis</span>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4">
                                        <p className="text-3xl font-bold text-[#BC804C]">+12%</p>
                                        <p className="text-[11px] text-[#666666] mt-1">Efficiency increase expected based on current AI routing.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="w-full lg:w-[320px] flex flex-col gap-6 pointer-events-auto shrink-0">
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="text-sm font-medium">Active Operators</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-[#666666]" />
                                </div>
                                <div className="text-5xl font-light mb-8 text-center">24</div>
                                <div className="flex items-center gap-1 justify-center h-8">
                                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                        <div key={i} className="w-2 bg-[#BC804C]/20 rounded-full relative">
                                            <div className="absolute bottom-0 left-0 right-0 bg-[#BC804C] rounded-full" style={{ height: `${h}%` }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Grid className="w-4 h-4" />
                                        <span className="text-sm font-medium">Selected Zone</span>
                                    </div>
                                    <Maximize2 className="w-4 h-4 text-[#666666]" />
                                </div>
                                <div className="aspect-video bg-gray-900/5 rounded-2xl mb-4 flex items-center justify-center border border-white">
                                    <Box className="w-12 h-12 text-[#BC804C]/40" />
                                </div>
                                <p className="text-[11px] text-[#666666] leading-relaxed mb-4">
                                    High-throughput staging area. AI suggests moving delayed items to sector B.
                                </p>
                                <button className="w-full py-2.5 bg-[#BC804C] text-white rounded-xl text-sm font-medium shadow-md shadow-[#BC804C]/20 hover:bg-[#a66d3e] transition-colors">
                                    Optimize Route
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Table - Scrolls up over the 3D view */}
                    <div className="mt-6 pointer-events-auto pb-10">
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-lg">
                            <h3 className="text-xl font-medium mb-6">Inventory Database</h3>
                            <LogisticsTable />
                        </div>
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