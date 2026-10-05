"use client";

import { Suspense, useState } from "react";
import { Search, Download, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useStock } from "@/components/StockContext";
import type { StockItem } from "@/components/StockContext";
import { exportToPdf } from "@/lib/pdf";

export default function StafDataBarang() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat data barang...</p>}>
      <StafDataBarangContent />
    </Suspense>
  );
}

function StafDataBarangContent() {
  const searchParams = useSearchParams();
  const { items } = useStock() as { items: StockItem[] };
  const kategoriList: string[] = Array.from(new Set((items || []).map((i: any) => i.kategori as string)));
  const [activeTab, setActiveTab] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [selectionDismissed, setSelectionDismissed] = useState(false);
  const requestedItemId = Number(searchParams.get("item"));
  const requestedItem = Number.isSafeInteger(requestedItemId)
    ? items.find((item) => item.id === requestedItemId)
    : undefined;
  const selectedItem = selectionDismissed ? undefined : requestedItem;
  const displayedTab = selectedItem?.kategori ?? activeTab;
  const displayedSearch = selectedItem?.code ?? search;

  const tabs = kategoriList.map((k: string) => ({
    key: k,
    label: k === "bahan" ? "Stok Bahan" : k.charAt(0).toUpperCase() + k.slice(1),
    color: "text-foreground border-foreground",
    badge: "bg-muted text-foreground",
  }));

  const filtered = (items || []).filter((i: any) => {
    const matchTab = i.kategori === displayedTab;
    const matchSearch = i.name.toLowerCase().includes(displayedSearch.toLowerCase()) || i.code.toLowerCase().includes(displayedSearch.toLowerCase());
    return matchTab && matchSearch;
  });

  const currentBadge = tabs.find((t) => t.key === activeTab)?.badge || "";
  const totalStok = filtered.reduce((s: number, i: any) => s + i.stock, 0);

  const handleExport = () => {
    const head = displayedTab === "bahan" ? ["Kode", "Nama", "Satuan", "Stok"] : ["Kode", "Nama", "Merek", "Size", "Satuan", "Stok"];
    const body = filtered.map((i: any) =>
      displayedTab === "bahan"
        ? [i.code, i.name, i.satuan, String(i.stock)]
        : [i.code, i.name, i.brand || "-", i.size || "-", i.satuan, String(i.stock)]
    );
    exportToPdf(`Data Barang — ${displayedTab}`, head, body, `data-barang-${displayedTab}.pdf`);
  };

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">Data Barang</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Lihat data barang gudang (read-only).</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Stok</p>
            <p className="text-lg font-bold text-foreground">{totalStok}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex border-b border-border px-2 flex-wrap gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setSelectionDismissed(true); setActiveTab(tab.key); setSearch(""); }}
              className={`px-2 py-1.5 text-[11px] sm:text-sm font-medium transition-colors border-b-2 -mb-px ${displayedTab === tab.key ? tab.color : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
              <span className="ml-1 text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-full bg-muted text-muted-foreground">
                {(items || []).filter((i: any) => i.kategori === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="p-2 sm:p-3 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 sm:left-2.5 top-1.5 sm:top-2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Cari..."
                value={search}
                onChange={(e) => { setSelectionDismissed(true); setSearch(e.target.value); }}
                className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button onClick={handleExport} title="Export PDF" className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 bg-muted text-muted-foreground border border-border text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap">
              <Download size={12} /> <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                <th className="py-2 px-2 sm:px-4 font-medium">Kode</th>
                <th className="py-2 px-2 sm:px-4 font-medium">Nama</th>
                {displayedTab !== "bahan" && (
                  <>
                    <th className="py-2 px-2 sm:px-4 font-medium hidden sm:table-cell">Merek</th>
                    <th className="py-2 px-2 sm:px-4 font-medium hidden md:table-cell">Ukuran</th>
                  </>
                )}
                <th className="py-2 px-2 sm:px-4 font-medium hidden sm:table-cell">Satuan</th>
                <th className="py-2 px-2 sm:px-4 font-medium text-right">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={displayedTab !== "bahan" ? 6 : 4} className="py-10 text-center text-muted-foreground">Tidak ada data.</td>
                </tr>
              ) : filtered.map((item: any) => (
                <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${selectedItem?.id === item.id ? "bg-destructive/5" : ""}`}>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 font-mono text-muted-foreground">{item.code}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${currentBadge}`}>{item.kategori?.toUpperCase()}</span>
                      <p className="font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                      {item.stock <= 20 && <span role="img" aria-label="Stok menipis" title="Stok menipis"><AlertCircle size={14} className="shrink-0 text-destructive" /></span>}
                    </div>
                  </td>
                  {displayedTab !== "bahan" && (
                    <>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">{item.brand || "-"}</td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden md:table-cell">{item.size || "-"}</td>
                    </>
                  )}
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">{item.satuan || "pcs"}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 font-semibold text-right">{item.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">{filtered.length} item</div>
        )}
      </div>
    </div>
  );
}
