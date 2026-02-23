'use client'; // Zwingend erforderlich für useState und Zustand im App Router!

import { useState } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Falls du die cn() Utility aus dem JLS Projekt hast

export const MagicSearchbar = () => {
    const [prompt, setPrompt] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Wir abonnieren nur die Actions und spezifischen States aus dem Store,
    // um unnötige Re-Renders der Suchleiste zu vermeiden.
    const applyAIFilter = useLogisticsStore((state) => state.applyAIFilter);
    const resetFilter = useLogisticsStore((state) => state.resetFilter);
    const isFiltered = useLogisticsStore((state) => state.pallets.length !== state.filteredPallets.length);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsSearching(true);

        try {
            const response = await fetch('/api/parse-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Netzwerk- oder API-Fehler');
            }

            const data = await response.json();

            // BAM! Wir übergeben das Zod-validierte Objekt an unseren Store.
            // Ab hier übernehmen React Three Fiber und die 2D Tabelle automatisch.
            if (data.filter) {
                applyAIFilter(data.filter);
            }
        } catch (error) {
            console.error("Fehler bei der Intent-Erkennung:", error);
            // Senior Move: In Produktion würde hier ein Toast (z.B. react-hot-toast) aufpoppen
        } finally {
            setIsSearching(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        resetFilter();
    };

    return (
        <div className="w-full max-w-xl">
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "relative flex items-center w-full transition-all duration-500 ease-in-out",
                    "bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden",
                    "hover:bg-white/60",
                    isFiltered ? "ring-2 ring-[#BC804C]/20 border-[#BC804C]/50" : "focus-within:border-[#BC804C]/50"
                )}
            >
                <div className={cn(
                    "pl-5 pr-2 transition-colors duration-300",
                    isSearching ? "text-[#BC804C]" : "text-[#666666]"
                )}>
                    <Sparkles className={cn("w-4 h-4", isSearching && "animate-pulse")} />
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Search space or ask AI..."
                    className="w-full py-4 pr-12 text-[#2D2D2D] bg-transparent outline-none placeholder:text-[#666666]/60 text-sm font-medium"
                    disabled={isSearching}
                />

                <div className="absolute right-3 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="w-4 h-4 text-[#BC804C] animate-spin" />
                    ) : (
                        isFiltered && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 text-[#666666] hover:text-[#2D2D2D] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )
                    )}
                </div>
            </form>
        </div>
    );
};