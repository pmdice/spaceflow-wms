'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { Package, MapPin, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Dein Tailwind-Merge Helper

export const LogisticsTable = () => {
    // 1. Daten aus dem Store holen
    const pallets = useLogisticsStore((state) => state.filteredPallets);
    const activeHighlightColor = useLogisticsStore((state) => state.activeHighlightColor);

    // 2. Referenz für den scrollbaren Container
    const parentRef = useRef<HTMLDivElement>(null);

    // 3. Der Virtualizer (Das Geheimnis für 60fps bei 10.000 Reihen)
    const rowVirtualizer = useVirtualizer({
        count: pallets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72, // Geschätzte Höhe einer Reihe in Pixeln
        overscan: 5, // Render 5 Reihen extra oben/unten, um Flackern beim Scrollen zu vermeiden
    });

    // Helper für Status-Icons
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'delayed': return { icon: AlertCircle, color: 'text-white', bg: 'bg-[#BC804C]', border: 'border-[#BC804C]', label: 'Delayed' };
            case 'transit': return { icon: Clock, color: 'text-[#2D2D2D]', bg: 'bg-muted/50', border: 'border-muted-foreground/20', label: 'In Transit' };
            case 'stored': return { icon: CheckCircle2, color: 'text-[#2D2D2D]', bg: 'bg-background', border: 'border-border', label: 'Stored' };
            default: return { icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-transparent', label: 'Unknown' };
        }
    };

    if (pallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-[#F0F0F0]/50 backdrop-blur-sm rounded-[2rem] border border-[#D1D1D1]">
                <div className="p-4 bg-white/50 rounded-2xl mb-4">
                    <Package className="w-10 h-10 text-[#D1D1D1]" />
                </div>
                <p className="text-[#2D2D2D] font-medium">No pallets found.</p>
                <p className="text-[#666666] text-sm">Try another query.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[400px] transition-all duration-500">
            {/* Tabellen-Header */}
            <div className="grid grid-cols-5 gap-4 px-8 py-3 border-b bg-muted/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div>ID</div>
                <div>Destination</div>
                <div>Status</div>
                <div>Address</div>
                <div className="text-right">Weight</div>
            </div>

            {/* Scroll-Container für Virtualization */}
            <div ref={parentRef} className="flex-1 overflow-auto relative custom-scrollbar">
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const pallet = pallets[virtualRow.index];
                        const statusCfg = getStatusConfig(pallet.status);
                        const StatusIcon = statusCfg.icon;

                        const isHighlighted = !!activeHighlightColor;

                        return (
                            <div
                                key={virtualRow.index}
                                className="absolute top-0 left-0 w-full border-b border-[#D1D1D1]/10 hover:bg-white/30 transition-all duration-200 group"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    borderLeft: isHighlighted ? `4px solid ${activeHighlightColor}` : '4px solid transparent',
                                }}
                            >
                                <div className="grid grid-cols-5 gap-4 px-8 items-center h-full text-xs">
                                    <div className="font-mono text-[#2D2D2D] font-bold tracking-tight">{pallet.id}</div>

                                    <div className="flex items-center gap-2 text-[#666666] font-medium">
                                        {pallet.destination}
                                    </div>

                                    <div>
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm",
                        statusCfg.bg,
                        statusCfg.color,
                        statusCfg.border
                    )}>
                        {statusCfg.label}
                    </span>
                                    </div>

                                    <div>
                                        <div className="font-mono text-[#666666] text-[9px] bg-white/50 border border-[#D1D1D1]/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                            {pallet.logicalAddress.id}
                                        </div>
                                    </div>

                                    <div className="text-right text-[#2D2D2D] font-bold">
                                        {pallet.weightKg} <span className="text-[9px] text-[#666666] font-normal">kg</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};