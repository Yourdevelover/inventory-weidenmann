"use client";

import { useState } from "react";
import { useStock, type Target } from "@/components/StockContext";
import { CheckCircle2, Trash2, Pencil, Check, X, Plus, Download } from "lucide-react";
import { exportToPdf } from "@/lib/pdf";

type Periode = "harian" | "mingguan" | "bulanan";

export default function TargetBarang() {
  const { items, targets, addTarget, updateTarget, deleteTarget } = useStock();
  const produk = (items || []).filter((i: any) => i.type === "produk");

  const [successMsg, setSuccessMsg] = useState("");

  // modal tambah
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selKategori, setSelKategori] = useState<string>("");
  const [selItemId, setSelItemId] = useState<number | "">("");
  const [periode, setPeriode] = useState<Periode>("harian");
  const [jumlah, setJumlah] = useState("");

  // modal edit
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [editJumlah, setEditJumlah] = useState("");

  const kategoriList: string[] = Array.from(new Set(produk.map((i: any) => i.kategori as string)));

  const filteredProduk = selKategori ? produk.filter((i: any) => i.kategori === selKategori) : [];
  const selectedItem = produk.find((i: any) => i.id === Number(selItemId));

  const openAdd = () => {
    setSelKategori(""); setSelItemId(""); setPeriode("harian"); setJumlah("");
    setIsAddOpen(true);
  };

  const handleKategori = (k: string) => {
    setSelKategori(k);
    setSelItemId("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selKategori || !selItemId || !jumlah || !selectedItem) return;
    const newTarget = await addTarget({
        itemId: Number(selItemId),
        itemName: selectedItem.name,
        brand: selectedItem.brand || "-",
        kategori: selKategori,
        periode,
        jumlah: parseInt(jumlah),
        createdAt: new Date().toISOString().slice(0, 10),
    });
    setSuccessMsg(`Target ${periode} ${newTarget.jumlah} pcs disimpan!`);
    setIsAddOpen(false);
    setJumlah("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = async (id: number) => {
    await deleteTarget(id);
  };

  const startEdit = (t: Target) => {
    setEditingTarget(t);
    setEditJumlah(String(t.realisasi));
  };

  const confirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;
    const val = parseInt(editJumlah);
    if (isNaN(val) || val < 0) return;
    await updateTarget(editingTarget.id, { realisasi: val });
    setEditingTarget(null);
    setSuccessMsg("Realisasi berhasil diupdate!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const cancelEdit = () => {
    setEditingTarget(null);
    setEditJumlah("");
  };

  const periodeBadge: Record<Periode, string> = {
    harian: "bg-blue-50 text-blue-700 border border-blue-100",
    mingguan: "bg-amber-50 text-amber-700 border border-amber-100",
    bulanan: "bg-purple-50 text-purple-700 border border-purple-100",
  };

  const handleExport = () => {
    const head = ["Item", "Kategori", "Periode", "Target", "Realisasi", "Tanggal"];
    const body = targets.map((t) => [t.itemName, t.kategori, t.periode, String(t.jumlah), String(t.realisasi), t.createdAt]);
    exportToPdf("Target Produksi", head, body, "target-produksi.pdf");
  };

  const inputClass = "w-full border border-input rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-ring outline-none disabled:opacity-50 disabled:bg-muted";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-start">
        <div>
          <h1 className="text-base font-bold tracking-tight text-foreground">Target Barang</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Tetapkan target produksi per produk.</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <button onClick={handleExport} className="flex items-center gap-1 sm:gap-1.5 bg-muted text-muted-foreground border border-border text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap">
            <Download size={12} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={openAdd} className="flex items-center gap-1 sm:gap-1.5 bg-primary text-primary-foreground text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={12} /> <span className="hidden sm:inline">Tambah Target</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded-lg flex items-center gap-2 text-[11px]">
          <CheckCircle2 size={12} /><span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Grid daftar target */}
      {targets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-12 text-center text-xs text-muted-foreground">
          Belum ada target. Klik "Tambah Target" untuk membuat.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {targets.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${periodeBadge[t.periode]}`}>{t.periode}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${t.kategori === "sandal" ? "bg-purple-50 text-purple-700" : "bg-orange-50 text-orange-700"}`}>{t.kategori?.toUpperCase()}</span>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => startEdit(t)} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Realisasi"><Pencil size={11} /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Hapus"><Trash2 size={11} /></button>
                </div>
              </div>
              <h3 className="text-xs font-semibold text-foreground leading-snug line-clamp-2 flex-1" title={t.itemName}>{t.itemName}</h3>
              <p className="text-[9px] text-muted-foreground mt-0.5">{t.brand} · {t.createdAt}</p>
              <div className="mt-2 pt-2 border-t border-border flex items-end justify-between">
                <p className="text-[9px] text-muted-foreground">Target</p>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground leading-none">{t.jumlah.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">pcs / {t.periode}</p>
                </div>
              </div>
              <div className="mt-1">
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-muted-foreground">Realisasi</span>
                  <span className="font-semibold text-primary">{t.realisasi} / {t.jumlah}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${t.jumlah > 0 ? Math.min((t.realisasi / t.jumlah) * 100, 100) : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Target */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold text-sm text-foreground">Tambah Target</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Kategori</label>
                <div className="flex gap-1.5 flex-wrap">
                  {kategoriList.map((k: string) => (
                    <button type="button" key={k} onClick={() => handleKategori(k)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border capitalize transition-colors ${selKategori === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Produk</label>
                <select required value={selItemId} onChange={(e) => setSelItemId(e.target.value ? Number(e.target.value) : "")} disabled={!selKategori} className={inputClass}>
                  <option value="">{!selKategori ? "-- Pilih kategori dulu --" : filteredProduk.length === 0 ? "-- Tidak ada produk --" : "-- Pilih nama / merek --"}</option>
                  {filteredProduk.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name}{i.brand ? ` - ${i.brand}` : ""}{i.size ? ` (Size ${i.size})` : ""}</option>
                  ))}
                </select>
                {selKategori && filteredProduk.length === 0 && <p className="text-[10px] text-amber-600 mt-1">Belum ada produk {selKategori}. Tambah di Stok Barang.</p>}
              </div>
              {selectedItem && (
                <div className="bg-muted/50 p-2 rounded border border-border text-xs text-muted-foreground">
                  Stok: <strong className="text-foreground">{selectedItem.stock} {selectedItem.satuan || "pcs"}</strong>
                  {selectedItem.brand && <span> · {selectedItem.brand}</span>}
                  {selectedItem.size && <span> · Size {selectedItem.size}</span>}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Periode</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["harian","mingguan","bulanan"] as Periode[]).map(p => (
                    <button type="button" key={p} onClick={() => setPeriode(p)}
                      className={`py-1.5 text-xs font-medium rounded border capitalize transition-colors ${periode === p ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target Jumlah <span className="text-muted-foreground">({periode})</span></label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" required placeholder="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} className={inputClass} />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" disabled={!selKategori || !selItemId || !jumlah} className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Target */}
      {editingTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold text-sm text-foreground">Edit Target</h2>
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={confirmEdit} className="p-4 space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-xs font-semibold text-foreground">{editingTarget.itemName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{editingTarget.kategori.toUpperCase()} · {editingTarget.brand} · {editingTarget.periode}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Realisasi (sudah diproduksi)</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" required autoFocus value={editJumlah} onChange={(e) => setEditJumlah(e.target.value)} className={inputClass} />
              </div>
              <p className="text-[10px] text-muted-foreground">Target: {editingTarget.jumlah} pcs</p>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={cancelEdit} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md flex items-center justify-center gap-1"><Check size={14} /> Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
