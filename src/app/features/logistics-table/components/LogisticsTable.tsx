'use client';

import { useMemo, useRef, useState } from 'react';
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLogisticsStore } from '@/store/useLogisticsStore';
import type { SpatialPallet } from '@/types/wms';
import { ArrowUpDown, AlertCircle, Clock, CheckCircle2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const LogisticsTable = () => {
    const pallets = useLogisticsStore((state) => state.filteredPallets);
    const activeHighlightColor = useLogisticsStore((state) => state.activeHighlightColor);
    const hoveredPalletId = useLogisticsStore((state) => state.hoveredPalletId);
    const setHoveredPalletId = useLogisticsStore((state) => state.setHoveredPalletId);
    const selectedPalletId = useLogisticsStore((state) => state.selectedPalletId);
    const setSelectedPalletId = useLogisticsStore((state) => state.setSelectedPalletId);
    const [sorting, setSorting] = useState<SortingState>([]);
    const parentRef = useRef<HTMLDivElement>(null);

    const getStatusConfig = (status: SpatialPallet['status']) => {
        switch (status) {
            case 'delayed': return { icon: AlertCircle, color: 'text-white', bg: 'bg-[#BC804C]', border: 'border-[#BC804C]', label: 'Delayed' };
            case 'transit': return { icon: Clock, color: 'text-[#2D2D2D]', bg: 'bg-muted/50', border: 'border-muted-foreground/20', label: 'In Transit' };
            case 'stored': return { icon: CheckCircle2, color: 'text-[#2D2D2D]', bg: 'bg-background', border: 'border-border', label: 'Stored' };
            default: return { icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-transparent', label: 'Unknown' };
        }
    };

    const columns = useMemo<ColumnDef<SpatialPallet>[]>(() => [
        {
            accessorKey: 'id',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="-ml-3 h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    ID
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-mono text-[#2D2D2D] font-bold tracking-tight">{row.original.id}</div>
            ),
        },
        {
            accessorKey: 'destination',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="-ml-3 h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Destination
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => <div className="text-[#666666] font-medium">{row.original.destination}</div>,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="-ml-3 h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Status
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => {
                const statusCfg = getStatusConfig(row.original.status);
                const StatusIcon = statusCfg.icon;
                return (
                    <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase border shadow-sm",
                        statusCfg.bg,
                        statusCfg.color,
                        statusCfg.border
                    )}>
                        <StatusIcon className="size-3" />
                        {statusCfg.label}
                    </span>
                );
            },
        },
        {
            id: 'address',
            header: () => <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Address</div>,
            cell: ({ row }) => (
                <div className="font-mono text-[#666666] text-[9px] bg-white/50 border border-[#D1D1D1]/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    {row.original.logicalAddress.id}
                </div>
            ),
        },
        {
            accessorKey: 'weightKg',
            header: ({ column }) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        className="-mr-3 h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        Weight
                        <ArrowUpDown className="size-3.5" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right text-[#2D2D2D] font-bold">
                    {row.original.weightKg} <span className="text-[9px] text-[#666666] font-normal">kg</span>
                </div>
            ),
        },
    ], []);

    // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table exposes non-memoizable APIs; this warning is expected.
    const table = useReactTable({
        data: pallets,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const rows = table.getRowModel().rows;
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 8,
    });
    const virtualRows = rowVirtualizer.getVirtualItems();
    const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
    const paddingBottom = virtualRows.length > 0
        ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
        : 0;

    return (
        <div className="flex h-full min-h-0 flex-col transition-all duration-500">
            <div ref={parentRef} className="flex-1 min-h-0 overflow-auto relative custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 z-20 bg-muted/30 backdrop-blur-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="px-8 first:pl-8 last:pr-8">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length ? (
                            <>
                                {paddingTop > 0 && (
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableCell style={{ height: `${paddingTop}px`, padding: 0 }} colSpan={columns.length} />
                                    </TableRow>
                                )}
                                {virtualRows.map((virtualRow) => {
                                    const row = rows[virtualRow.index];
                                    return (
                                <TableRow
                                    key={row.id}
                                    className={cn(
                                        "h-[72px] border-[#D1D1D1]/10 hover:bg-white/30 cursor-pointer",
                                        hoveredPalletId === row.original.id && "bg-blue-50/80"
                                    )}
                                    onMouseEnter={() => setHoveredPalletId(row.original.id)}
                                    onMouseLeave={() => setHoveredPalletId(null)}
                                    onClick={() => setSelectedPalletId(row.original.id)}
                                    style={{
                                        boxShadow: selectedPalletId === row.original.id
                                            ? 'inset 4px 0 0 #f97316'
                                            : activeHighlightColor
                                                ? `inset 4px 0 0 ${activeHighlightColor}`
                                                : undefined,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-8 first:pl-8 last:pr-8 text-xs">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                    );
                                })}
                                {paddingBottom > 0 && (
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableCell style={{ height: `${paddingBottom}px`, padding: 0 }} colSpan={columns.length} />
                                    </TableRow>
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-4 bg-white/50 rounded-2xl mb-4">
                                            <Package className="w-10 h-10 text-[#D1D1D1]" />
                                        </div>
                                        <p className="text-[#2D2D2D] font-medium">No pallets found.</p>
                                        <p className="text-[#666666] text-sm">Try another query.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};