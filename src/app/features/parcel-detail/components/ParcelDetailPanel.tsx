'use client';

import type { PalletEvent, SpatialPallet } from '@/types/wms';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, Package2, MapPin, Weight, Clock3, ShieldCheck, type LucideIcon } from 'lucide-react';

type ParcelDetailPanelProps = {
    pallet: SpatialPallet | null;
    events: PalletEvent[];
    onClose: () => void;
};

const statusStyles: Record<SpatialPallet['status'], string> = {
    delayed: 'bg-[#BC804C] text-white border-[#BC804C]',
    transit: 'bg-slate-100 text-slate-700 border-slate-300',
    stored: 'bg-white text-slate-700 border-slate-300',
};

const getRecommendedAction = (pallet: SpatialPallet) => {
    if (pallet.status === 'delayed') return 'Expedite handling and notify outbound team';
    if (pallet.status === 'transit') return 'Track movement and confirm handover checkpoint';
    return 'No exception. Keep in storage until release.';
};

export const ParcelDetailPanel = ({ pallet, events, onClose }: ParcelDetailPanelProps) => {
    const recentEvents = events.slice(0, 4);

    return (
        <aside className={cn(
            'absolute top-20 right-6 z-40 w-[320px] rounded-2xl border border-white/60 bg-white/88',
            'backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] pointer-events-auto',
            'transition-all duration-300',
            pallet ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0 pointer-events-none'
        )}>
            {pallet && (
                <div className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-500">Parcel Detail</p>
                            <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{pallet.id}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Close parcel details">
                            <X className="size-4" />
                        </Button>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                        <Badge className={cn('border', statusStyles[pallet.status])}>
                            {pallet.status === 'transit' ? 'In Transit' : pallet.status === 'stored' ? 'Stored' : 'Delayed'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-600">
                            Urgency: {pallet.urgency}
                        </Badge>
                    </div>

                    <div className="space-y-2 rounded-xl bg-slate-50/80 p-3 border border-slate-200/70">
                        <Row icon={MapPin} label="Destination" value={pallet.destination} />
                        <Row icon={Package2} label="Storage Address" value={pallet.logicalAddress.id} />
                        <Row icon={Weight} label="Weight" value={`${pallet.weightKg} kg`} />
                        <Row icon={Clock3} label="Last Scan" value={new Date(pallet.lastScannedAt).toLocaleString()} />
                    </div>

                    <div className="mt-3 rounded-xl border border-[#BC804C]/20 bg-[#BC804C]/5 p-3">
                        <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-[#8c5f35]">
                            <ShieldCheck className="size-3.5" />
                            Recommended Next Step
                        </p>
                        <p className="text-xs text-slate-700">{getRecommendedAction(pallet)}</p>
                    </div>

                    <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/85 p-3">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] font-semibold text-slate-500">Lifecycle Events</p>
                        <div className="space-y-1.5">
                            {recentEvents.length ? recentEvents.map((event) => (
                                <div key={event.id} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-slate-800">{formatEventType(event.type)}</span>
                                        <span className="text-slate-500">{new Date(event.at).toLocaleString()}</span>
                                    </div>
                                    <div className="mt-0.5 text-slate-500">
                                        {event.actor} via {event.source}{event.note ? ` - ${event.note}` : ''}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-500">No events available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

function formatEventType(eventType: PalletEvent['type']) {
    switch (eventType) {
        case 'delay_flagged':
            return 'Delay Flagged';
        default:
            return eventType.charAt(0).toUpperCase() + eventType.slice(1);
    }
}

function Row({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
                <Icon className="size-3.5" />
                {label}
            </span>
            <span className="font-medium text-slate-800 text-right">{value}</span>
        </div>
    );
}
