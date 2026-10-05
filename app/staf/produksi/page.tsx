"use client";

import { useState, useEffect } from "react";
import { useStock } from "@/components/StockContext";
import { PenTool, CheckCircle2, Trash2, Download } from "lucide-react";
import { exportToPdf } from "@/lib/pdf";

type LaporanCacat = {
  id: number;
  tipe: "barang" | "bahan";
  itemId: number;
  itemName: string;
  jenisCacat: string;
  jumlah: number;
  tanggal: string;
};

async function fetchJSON(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function StafProduksi() {
  const { items, refresh } = useStock();
  const [laporan, setLaporan] = useState<LaporanCacat[]>([]);
  const [success, setSuccess] = useState(false);
  const [tipe, setTipe] = useState<"barang" | "bahan">("barang");
  const [itemId, setItemId] = useState<number | "">("");
  const [jenisCacat, setJenisCacat] = useState("");
  const [jumlah, setJumlah] = useState("");

  const refreshLaporan = async () => {
    try {
      const data = await fetchJSON("/api/laporan-cacat");
      setLaporan(data);
    } catch (e) {
      console.error("Gagal load laporan:", e);
    }
  };

  useEffect(() => { refreshLaporan(); }, []);

  const daftar = (items || []).filter((i: any) => tipe === "barang" ? i.type === "produk" : i.type === "bahan");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !jenisCacat || !jumlah) return;
    const selected = (items || []).find((i: any) => i.id === Number(itemId));
    if (!selected) return;
    const newLap = await fetchJSON("/api/laporan-cacat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipe, itemId: Number(itemId), jenisCacat, jumlah: parseInt(jumlah),
        tanggal: new Date().toISOString().slice(0, 10),
      }),
    });
    setLaporan([newLap, ...laporan]);
    refresh();
    setSuccess(true);
    setItemId(""); setJenisCacat(""); setJumlah("");
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async (id: number) => {
    await fetchJSON(`/api/laporan-cacat/${id}`, { method: "DELETE" });
    setLaporan(laporan.filter(l => l.id !== id));
  };

  const handleExport = () => {
    const head = ["Item", "Tipe", "Jenis Cacat", "Jumlah", "Tanggal"];
    const body = laporan.map((l) => [l.itemName, l.tipe, l.jenisCacat, String(l.jumlah), l.tanggal]);
    exportToPdf("Laporan Barang Rusak", head, body, "barang-rusak.pdf");
  };

  const inputClass = "w-full border border-input rounded-md p-2.5 text-sm bg-background focus:ring-1 focus:ring-ring outline-none";

  return (
    <div className="max-w-xl mx-auto space-y-3 mt-2">
      <div className="text-center space-y-1.5">
        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
          <PenTool size={20} />
        </div>
        <h1 className="text-base font-bold tracking-tight text-foreground">Barang Rusak</h1>
        <p className="text-xs text-muted-foreground">Laporkan barang atau bahan yang rusak.</p>
        {laporan.length > 0 && (
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground border border-border text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors mt-2">
            <Download size={14} /> Export PDF
          </button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} />
          <span className="font-medium text-sm">Laporan berhasil dikirim!</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Pilih Jenis</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["barang", "bahan"] as const).map(k => (
                <button type="button" key={k} onClick={() => { setTipe(k); setItemId(""); }}
                  className={`py-2 text-xs font-medium rounded border capitalize transition-colors ${tipe === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                  {k === "barang" ? "Barang Cacat" : "Bahan Baku"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Pilih {tipe === "barang" ? "Barang" : "Bahan"}</label>
            <select required value={itemId} onChange={(e) => setItemId(e.target.value ? Number(e.target.value) : "")} className={inputClass}>
              <option value="">-- Pilih {tipe === "barang" ? "barang" : "bahan"} --</option>
              {daftar.map((i: any) => (
                <option key={i.id} value={i.id}>{i.name}{i.brand ? ` - ${i.brand}` : ""}{i.size ? ` (Size ${i.size})` : ""}</option>
              ))}
            </select>
            {daftar.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Belum ada {tipe === "barang" ? "barang" : "bahan"}. Tambah dulu di menu terkait.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Jenis Cacat</label>
            <input type="text" required placeholder="Contoh: Jahitan miring, lem terkelupas..." value={jenisCacat} onChange={(e) => setJenisCacat(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Jumlah Cacat</label>
            <input type="text" inputMode="numeric" pattern="[0-9]*" required placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className={inputClass} />
          </div>

          <div className="pt-2 border-t border-border">
            <button type="submit" disabled={!itemId || !jenisCacat || !jumlah} className="w-full bg-primary text-primary-foreground font-medium text-sm px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50">
              Kirim Laporan
            </button>
          </div>
        </form>
      </div>

      {laporan.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Riwayat Barang Rusak</h2>
          <div className="space-y-2">
            {laporan.map(l => (
              <div key={l.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-muted/30">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{l.itemName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mr-1 ${l.tipe === "barang" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>{l.tipe.toUpperCase()}</span>
                    {l.jenisCacat} &middot; {l.jumlah} pcs &middot; {l.tanggal}
                  </p>
                </div>
                <button onClick={() => handleDelete(l.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0" title="Hapus"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
