"use client";

import { TrendingUp, AlertCircle, Package, Target, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useStock } from "@/components/StockContext";

export default function Dashboard() {
  const { items, transactions, targets, loading } = useStock();

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-lg border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const targetAktif = targets.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const produksiHarian = transactions.filter((t) => t.type === "masuk" && t.tanggal === todayStr).reduce((s, t) => s + t.quantity, 0);
  const stokBarangJadi = items.filter((i) => i.type === "produk").reduce((s, i) => s + i.stock, 0);
  const stokKritis = items.filter((i) => i.stock <= 20);

  const targetProgress = targets.slice(0, 3).map((t) => ({
    name: t.itemName,
    jumlah: t.jumlah,
    realisasi: t.realisasi,
    pct: t.jumlah > 0 ? Math.min(100, Math.round((t.realisasi / t.jumlah) * 100)) : 0,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Link href="/admin/produksi" className="bg-card text-card-foreground p-3 rounded-lg border border-border shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-medium tracking-tight">Target Aktif</p>
            <Target size={14} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">{targetAktif}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total target produksi</p>
        </Link>
        <Link href="/admin/laporan" className="bg-card text-card-foreground p-3 rounded-lg border border-border shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-medium tracking-tight">Produksi Hari Ini</p>
            <TrendingUp size={14} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">{produksiHarian.toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Barang masuk hari ini</p>
        </Link>
        <Link href="/admin/barang" className="bg-card text-card-foreground p-3 rounded-lg border border-border shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-medium tracking-tight">Stok Barang Jadi</p>
            <Package size={14} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">{stokBarangJadi.toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total produk di gudang</p>
        </Link>
        <Link href="/admin/notifikasi" className="bg-card text-card-foreground p-3 rounded-lg border border-border shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] font-medium tracking-tight">Peringatan Stok</p>
            <AlertCircle size={14} className="text-destructive" />
          </div>
          <p className="text-lg font-bold">{stokKritis.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Stok ≤ 20 pcs</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link href="/admin/produksi" className="lg:col-span-2 bg-card text-card-foreground rounded-xl border border-border shadow-sm transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold tracking-tight">Progres Target Produksi</h2>
            <p className="text-sm text-muted-foreground mt-1">Target harian dan mingguan yang sedang berjalan.</p>
          </div>
          <div className="p-6 space-y-6">
            {targetProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada target produksi.</p>
            ) : targetProgress.map((t) => (
              <div key={t.name}>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground">{t.realisasi} / {t.jumlah} <span className="font-medium text-primary ml-1">{t.pct}%</span></span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${t.pct}%` }}></div>
                </div>
              </div>
            ))}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-center h-40 bg-muted/30 rounded-lg text-muted-foreground text-sm gap-2">
                <BarChart3 size={20} /> [Area Grafik Trend Produksi Mingguan]
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold tracking-tight">Stok Kritis</h2>
            <p className="text-sm text-muted-foreground mt-1">Bahan yang perlu segera dipesan ulang.</p>
          </div>
          <div className="p-0">
            {stokKritis.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Tidak ada stok kritis.</p>
            ) : stokKritis.map((i) => (
              <Link key={i.id} href={`/admin/barang?item=${i.id}`} className="block p-4 border-b border-border hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                <p className="text-sm font-medium">{i.name}</p>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">Sisa: {i.stock} {i.satuan}</span>
                  <span>Min: 20 {i.satuan}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
