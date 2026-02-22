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
        <div className="w-full max-w-3xl mx-auto">
            <form
                onSubmit={handleSubmit}
                className={cn(
                    "relative flex items-center w-full transition-all duration-300",
                    "bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden",
                    isFiltered ? "ring-2 ring-blue-500 border-transparent" : "focus-within:ring-2 focus-within:ring-gray-300"
                )}
            >
                {/* Das KI-Icon als optischer Anker */}
                <div className="pl-4 pr-2 text-blue-500">
                    <Sparkles className="w-5 h-5" />
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Frag die KI: 'Zeig mir verspätete Paletten für Bern in rot...'"
                    className="w-full py-4 pr-14 text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
                    disabled={isSearching}
                />

                {/* Lade-Spinner oder X-Button zum Zurücksetzen */}
                <div className="absolute right-3 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                        isFiltered && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                title="Filter zurücksetzen"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )
                    )}
                </div>
            </form>

            {/* Visuelles Feedback für den User, dass ein Filter aktiv ist */}
            {isFiltered && !isSearching && (
                <div className="mt-2 text-sm text-blue-600 font-medium flex items-center gap-1 justify-center animate-in fade-in slide-in-from-top-2">
                    <Sparkles className="w-3 h-3" />
                    KI-Filter ist aktiv.
                </div>
            )}
        </div>
    );
};