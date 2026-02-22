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
            case 'delayed': return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
            case 'transit': return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' };
            case 'stored': return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' };
            default: return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50' };
        }
    };

    if (pallets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
                <Package className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Keine Paletten für diesen Filter gefunden.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            {/* Tabellen-Header */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b bg-gray-50 text-sm font-semibold text-gray-600">
                <div>ID</div>
                <div>Zielort</div>
                <div>Status</div>
                <div>Logische Adresse</div>
                <div className="text-right">Gewicht</div>
            </div>

            {/* Scroll-Container für Virtualization */}
            <div ref={parentRef} className="flex-1 overflow-auto relative">
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const pallet = pallets[virtualRow.index];
                        const StatusIcon = getStatusConfig(pallet.status).icon;

                        // Wenn die KI eine Farbe zurückgegeben hat, nutzen wir diese für den Rand
                        const isHighlighted = !!activeHighlightColor;

                        return (
                            <div
                                key={virtualRow.index}
                                className="absolute top-0 left-0 w-full border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    // Hier wenden wir die KI-Farbe dynamisch an!
                                    borderLeft: isHighlighted ? `4px solid ${activeHighlightColor}` : '4px solid transparent',
                                    backgroundColor: isHighlighted ? `${activeHighlightColor}10` : undefined // 10 ist Hex-Alpha für leichte Transparenz
                                }}
                            >
                                <div className="grid grid-cols-5 gap-4 p-4 items-center h-full text-sm">
                                    <div className="font-mono text-gray-900 font-medium">{pallet.id}</div>

                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {pallet.destination}
                                    </div>

                                    <div>
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        getStatusConfig(pallet.status).bg,
                        getStatusConfig(pallet.status).color
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                        {pallet.status.charAt(0).toUpperCase() + pallet.status.slice(1)}
                    </span>
                                    </div>

                                    <div className="font-mono text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded inline-block w-max">
                                        {pallet.logicalAddress.id}
                                    </div>

                                    <div className="text-right text-gray-600">
                                        {pallet.weightKg} kg
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