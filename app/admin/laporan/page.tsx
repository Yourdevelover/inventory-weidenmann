"use client";

import { useState, useEffect } from "react";
import { Package, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { useStock } from "@/components/StockContext";
import { exportToPdf } from "@/lib/pdf";

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function AdminLaporan() {
  const { items, targets } = useStock();
  const [laporan, setLaporan] = useState<any[]>([]);

  useEffect(() => {
    fetchJSON("/api/laporan-cacat").then(setLaporan).catch(console.error);
  }, []);

  const exportStok = () => {
    const head = ["Kode", "Nama", "Kategori", "Tipe", "Stok", "Satuan"];
    const body = (items || []).map((i: any) => [i.code, i.name, i.kategori, i.type, String(i.stock), i.satuan]);
    exportToPdf("Laporan Stok Gudang", head, body, "laporan-stok-gudang.pdf");
  };

  const exportProduksi = () => {
    const head = ["Item", "Kategori", "Periode", "Target", "Realisasi", "Tanggal"];
    const body = targets.map((t: any) => [t.itemName, t.kategori, t.periode, String(t.jumlah), String(t.realisasi), t.createdAt]);
    exportToPdf("Laporan Produksi", head, body, "laporan-produksi.pdf");
  };

  const exportCacat = () => {
    const head = ["Item", "Tipe", "Jenis Cacat", "Jumlah", "Tanggal"];
    const body = laporan.map((l: any) => [l.itemName, l.tipe, l.jenisCacat, String(l.jumlah), l.tanggal]);
    exportToPdf("Laporan Barang Cacat", head, body, "laporan-barang-cacat.pdf");
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base font-bold tracking-tight text-foreground">Laporan & Pencetakan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Unduh laporan operasional pabrik dalam format PDF.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow">
          <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center mb-3">
            <Package size={16} />
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Laporan Stok Gudang</h2>
          <p className="text-xs text-muted-foreground mb-4 flex-1">Posisi stok bahan baku dan barang jadi saat ini, termasuk histori barang masuk & keluar.</p>
          <button onClick={exportStok} className="bg-muted text-muted-foreground border border-border px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors w-full flex items-center justify-center gap-1.5 text-xs font-medium">
            <Download size={14} /> Unduh PDF
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow">
          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp size={16} />
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Laporan Produksi</h2>
          <p className="text-xs text-muted-foreground mb-4 flex-1">Perbandingan target VS hasil buatan pabrik dalam periode tertentu.</p>
          <button onClick={exportProduksi} className="bg-muted text-muted-foreground border border-border px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors w-full flex items-center justify-center gap-1.5 text-xs font-medium">
            <Download size={14} /> Unduh PDF
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col hover:shadow-md transition-shadow">
          <div className="w-8 h-8 bg-red-500/10 text-red-600 rounded-lg flex items-center justify-center mb-3">
            <AlertTriangle size={16} />
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Laporan Barang Cacat</h2>
          <p className="text-xs text-muted-foreground mb-4 flex-1">Daftar produk gagal (reject) beserta persentase dan rekap alasan kegagalan.</p>
          <button onClick={exportCacat} className="bg-muted text-muted-foreground border border-border px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors w-full flex items-center justify-center gap-1.5 text-xs font-medium">
            <Download size={14} /> Unduh PDF
          </button>
        </div>
      </div>
    </div>
  );
}
