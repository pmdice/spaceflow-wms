'use client';

import { useState } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PalletAction } from '@/types/wms';
import { toast } from 'sonner';
import { filterPallets } from '@/store/filter-pallets';

export const MagicSearchbar = () => {
    const [prompt, setPrompt] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const applyAIFilter = useLogisticsStore((state) => state.applyAIFilter);
    const applyPalletAction = useLogisticsStore((state) => state.applyPalletAction);
    const applyBulkPalletAction = useLogisticsStore((state) => state.applyBulkPalletAction);
    const restorePalletState = useLogisticsStore((state) => state.restorePalletState);
    const resetFilter = useLogisticsStore((state) => state.resetFilter);
    const isFiltered = useLogisticsStore((state) => state.pallets.length !== state.filteredPallets.length);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsSearching(true);
        setSubmitError(null);

        try {
            const response = await fetch('/api/parse-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? 'The AI filter request failed.');
            }

            const data = await response.json() as {
                intent?: {
                    intentType: 'filter' | 'action';
                    filter: Parameters<typeof applyAIFilter>[0];
                    action: PalletAction | null;
                    maxTargets: number;
                    targetPalletId: string | null;
                    targetZone: 'A' | 'B' | 'C' | null;
                    targetStatus: 'stored' | 'transit' | 'delayed' | null;
                    targetDestination: string | null;
                };
            };
            if (!data.intent) {
                throw new Error('No AI intent was returned.');
            }

            if (data.intent.intentType === 'filter') {
                applyAIFilter(data.intent.filter);
            } else if (data.intent.action) {
                const beforeState = useLogisticsStore.getState();
                const overrides = {
                    targetZone: data.intent.targetZone,
                    targetStatus: data.intent.targetStatus,
                    targetDestination: data.intent.targetDestination,
                };

                if (data.intent.targetPalletId) {
                    const previous = beforeState.pallets.find((item) => item.id === data.intent?.targetPalletId);
                    const result = applyPalletAction(
                        data.intent.targetPalletId,
                        data.intent.action,
                        overrides,
                    );
                    if (result.applied && previous) {
                        toast.success(`${formatActionLabel(data.intent.action)} applied`, {
                            description: `${data.intent.targetPalletId} updated via AI command.`,
                            action: {
                                label: 'Undo',
                                onClick: () => restorePalletState([previous], result.eventIds),
                            },
                        });
                    } else if (!result.applied) {
                        setSubmitError(`Pallet ${data.intent.targetPalletId} not found.`);
                    }
                } else {
                    const targets = filterPallets(beforeState.pallets, data.intent.filter).slice(0, Math.max(1, Math.min(50, data.intent.maxTargets)));
                    const previous = targets.map((target) => ({ ...target, logicalAddress: { ...target.logicalAddress } }));
                    const result = applyBulkPalletAction(
                        data.intent.action,
                        data.intent.filter,
                        data.intent.maxTargets,
                        overrides,
                    );
                    if (result.affected > 0) {
                        toast.success(`${formatActionLabel(data.intent.action)} applied`, {
                            description: `${result.affected} pallets updated via AI command.`,
                            action: {
                                label: 'Undo',
                                onClick: () => restorePalletState(previous, result.eventIds),
                            },
                        });
                    } else {
                        setSubmitError('No matching pallets found for this action.');
                    }
                }
            }
        } catch (error) {
            console.error("Fehler bei der Intent-Erkennung:", error);
            setSubmitError(error instanceof Error ? error.message : 'The AI filter request failed.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        setSubmitError(null);
        resetFilter();
    };

    return (
        <div className="w-full group">
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "relative flex items-center w-full transition-all duration-500 ease-in-out",
                    "rounded-2xl overflow-hidden border border-white/35",
                    "backdrop-blur-2xl supports-[backdrop-filter]:bg-white/25 bg-white/70",
                    "hover:supports-[backdrop-filter]:bg-white/35 focus-within:supports-[backdrop-filter]:bg-white/40",
                    "focus-within:border-[#BC804C]/30 focus-within:shadow-[0_0_20px_rgba(188,128,76,0.12)]",
                    isFiltered ? "ring-2 ring-[#BC804C]/20 border-[#BC804C]/30" : ""
                )}
            >
                <div className={cn(
                    "pl-5 pr-2 transition-all duration-300",
                    isSearching ? "text-[#BC804C]" : "text-muted-foreground group-hover:text-gray-900"
                )}>
                    <Sparkles className={cn("size-5", isSearching && "animate-pulse")} />
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Search inventory with AI... (e.g. 'show all delayed in Basel')"
                    className="w-full py-4 pr-12 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50 font-medium"
                    disabled={isSearching}
                />

                <div className="absolute right-3 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="size-4 text-primary animate-spin" />
                    ) : (
                        isFiltered && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="size-4" />
                            </button>
                        )
                    )}
                </div>
            </form>
            {submitError && (
                <p className="mt-2 px-1 text-xs font-medium text-red-700">
                    {submitError}
                </p>
            )}
        </div>
    );
};

function formatActionLabel(action: PalletAction): string {
    switch (action) {
        case 'delay':
            return 'Delay flag';
        case 'putaway':
            return 'Putaway';
        case 'set_destination':
            return 'Destination update';
        default:
            return action.charAt(0).toUpperCase() + action.slice(1);
    }
}