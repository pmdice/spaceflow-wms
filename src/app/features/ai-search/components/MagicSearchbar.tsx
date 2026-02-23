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
        <div className="w-full group">
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "relative flex items-center w-full transition-all duration-500 ease-in-out",
                    "bg-gray-100/50 hover:bg-white focus-within:bg-white rounded-2xl overflow-hidden border border-transparent focus-within:border-[#BC804C]/30 focus-within:shadow-[0_0_20px_rgba(188,128,76,0.1)] shadow-inner",
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
        </div>
    );
};