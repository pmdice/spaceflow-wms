'use client'; // Da wir Hooks (useEffect) nutzen, ist das eine Client Component

import { useEffect } from 'react';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import { MagicSearchbar } from '@/app/features/ai-search/components/MagicSearchbar';
import { LogisticsTable } from '@/app/features/logitstics-table/components/LogisticsTable';
import { Box, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const fetchData = useLogisticsStore((state) => state.fetchData);
  const isLoading = useLogisticsStore((state) => state.isLoading);
  const error = useLogisticsStore((state) => state.error);

  // Metriken für den Header
  const totalPallets = useLogisticsStore((state) => state.pallets.length);
  const filteredCount = useLogisticsStore((state) => state.filteredPallets.length);

  // Initiales Laden der Mock-Daten triggern
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return <div className="p-10 text-red-500 bg-red-50 rounded-lg m-10">Fehler: {error}</div>;
  }

  return (
      <div className="min-h-screen bg-[#f3f4f6] text-gray-900 p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header Sektion */}
          <header className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md">
                  <Box className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">SpaceFlow WMS</h1>
              </div>
              <p className="text-gray-500">Intelligentes Warehouse Management System</p>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Live Bestand</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin inline" /> : `${filteredCount} / ${totalPallets}`}
              </div>
            </div>
          </header>

          {/* Die Magische KI Suche */}
          <section>
            <MagicSearchbar />
          </section>

          {/* Haupt-Content Bereich (Hier kommt später noch die 3D Ansicht dazu!) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Linke Seite: 2D Tabelle */}
            <section className="flex flex-col space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Inventar-Liste</h2>
              {isLoading ? (
                  <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  </div>
              ) : (
                  <LogisticsTable />
              )}
            </section>

            {/* Rechte Seite: Platzhalter für React Three Fiber */}
            <section className="flex flex-col space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">3D Spatial View</h2>
              <div className="h-[600px] bg-slate-900 rounded-2xl shadow-inner border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="text-slate-500 font-mono text-sm text-center">
                  <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  WebGL Canvas initialisiert...<br/>
                  Wartet auf Three.js Integration.
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
  );
}