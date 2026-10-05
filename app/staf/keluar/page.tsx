"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Edit2, X, CheckCircle2, PackagePlus, Search, Download, Trash2 } from "lucide-react";
import { useStock } from "@/components/StockContext";
import { exportToPdf } from "@/lib/pdf";

export default function StafBarangKeluar() {
  const { items, addItem, recordMasuk, recordKeluar, updateItem, refresh } = useStock();
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newSatuan, setNewSatuan] = useState("pcs");
  const [newKategori, setNewKategori] = useState("sandal");
  const [newBrand, setNewBrand] = useState("");
  const [newSize, setNewSize] = useState("");

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"masuk"|"keluar"|"edit"|null>(null);
  const [txQty, setTxQty] = useState("");
  const [txTanggal, setTxTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [txJam, setTxJam] = useState(new Date().toTimeString().slice(0, 5));
  const [txTujuan, setTxTujuan] = useState("");
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSatuan, setEditSatuan] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editSize, setEditSize] = useState("");

  const produk = items.filter((i: any) => i.type === "produk" && i.name.toLowerCase().includes(search.toLowerCase()));
  const totalStok = items.filter((i: any) => i.type === "produk").reduce((s: number, i: any) => s + i.stock, 0);

  const [kategoriList, setKategoriList] = useState<string[]>(["sandal", "sepatu", "bahan"]);
  const [shakingKategori, setShakingKategori] = useState<string | null>(null);
  const [deleteAllMode, setDeleteAllMode] = useState(false);
  const [deleteAllTarget, setDeleteAllTarget] = useState<string | null>(null);

  const fetchKategori = async () => {
    try {
      const res = await fetch("/api/kategori");
      if (!res.ok) throw new Error("fetch failed");
      const rows: { name: string }[] = await res.json();
      if (rows.length === 0) throw new Error("empty");
      setKategoriList(rows.map(r => r.name));
    } catch { setKategoriList(["sandal", "sepatu", "bahan"]); }
  };

  useEffect(() => { fetchKategori(); }, []);

  const [kategoriFilter, setKategoriFilter] = useState<string>("semua");
  const produkFiltered = kategoriFilter === "semua" ? produk : produk.filter((i: any) => i.kategori === kategoriFilter);

  const handleExport = () => {
    const items = produkFiltered;
    const head = ["Kode", "Nama", "Kategori", "Merek", "Size", "Satuan", "Stok"];
    const body = items.map((i: any) => [i.code, i.name, i.kategori, i.brand || "-", i.size || "-", i.satuan, String(i.stock)]);
    exportToPdf(`Stok Barang — ${kategoriFilter === "semua" ? "Semua" : kategoriFilter.charAt(0).toUpperCase() + kategoriFilter.slice(1)}`, head, body, `stok-barang-${kategoriFilter}.pdf`);
  };

  const handleNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStock) return;
    const kategoriFinal = newKategori;
    if (!kategoriFinal) return;
    addItem(newName, newCode || "-", parseInt(newStock), newSatuan, "produk", kategoriFinal, newBrand || undefined, undefined, newSize || undefined);
    setSuccessMsg(`"${newName}" ditambahkan!`);
    setIsNewModalOpen(false);
    setNewName(""); setNewCode(""); setNewStock(""); setNewSatuan("pcs"); setNewKategori("sandal"); setNewBrand(""); setNewSize("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    const k = newKategoriName.trim().toLowerCase();
    if (!k) return;
    try {
      await fetch("/api/kategori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: k }),
      });
      await fetchKategori();
      setKategoriFilter(k);
      setSuccessMsg(`Kategori "${k}" ditambahkan!`);
      setTimeout(() => setSuccessMsg(""), 3000);
      setNewKategoriName("");
      setIsKategoriModalOpen(false);
    } catch { alert("Gagal tambah kategori"); }
  };
  const handleDeleteAllKategori = () => {
    setDeleteAllMode(true);
    setDeleteAllTarget(null);
    setShakingKategori(null);
  };

  const handleDeleteAllConfirm = (name: string) => {
    setDeleteAllTarget(name);
    setShakingKategori(name);
    setTimeout(() => {
      setShakingKategori(null);
      if (!confirm(`Hapus semua barang kategori "${name}"?`)) return;
      (async () => {
        try {
          await fetch(`/api/items?kategori=${encodeURIComponent(name)}`, { method: "DELETE" });
          await fetch(`/api/kategori?name=${encodeURIComponent(name)}`, { method: "DELETE" });
          await refresh();
          await fetchKategori();
          if (kategoriFilter === name) setKategoriFilter("semua");
          setDeleteAllMode(false);
          setDeleteAllTarget(null);
          setSuccessMsg(`Kategori "${name}" dan barangnya dihapus.`);
          setTimeout(() => setSuccessMsg(""), 3000);
        } catch { alert("Gagal hapus"); }
      })();
    }, 450);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (actionType === "edit") {
      updateItem(selectedItem.id, { name: editName, code: editCode, satuan: editSatuan, brand: editBrand || undefined, size: editSize || undefined });
      setSuccessMsg(`Data ${editName} diperbarui`);
    } else {
      const qty = parseInt(txQty);
      if (!txQty) return;
      if (actionType === "masuk") {
        recordMasuk(selectedItem.id, qty, txTanggal, txJam);
        setSuccessMsg(`Stok ${selectedItem.name} +${qty}`);
      } else {
        if (qty > selectedItem.stock) { alert("Jumlah melebihi stok!"); return; }
        recordKeluar(selectedItem.id, qty, txTanggal, txJam, txTujuan || "Keluar");
        setSuccessMsg(`Stok ${selectedItem.name} -${qty}`);
      }
    }
    setSelectedItem(null); setActionType(null);
    setTxQty(""); setTxTujuan("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const openAction = (item: any, type: "masuk"|"keluar"|"edit") => {
    setSelectedItem(item); setActionType(type);
    if (type === "edit") {
      setEditName(item.name); setEditCode(item.code);
      setEditSatuan(item.satuan || "pcs"); setEditBrand(item.brand || ""); setEditSize(item.size || "");
    } else {
      setTxTanggal(new Date().toISOString().slice(0, 10));
      setTxJam(new Date().toTimeString().slice(0, 5));
    }
  };

  const inputClass = "w-full border border-input rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-ring outline-none";
  const kategoriColor: any = { sandal: "bg-purple-500/10 text-purple-600", sepatu: "bg-orange-500/10 text-orange-600", bahan: "bg-blue-500/10 text-blue-600" };
  const getKategoriColor = (k: string) => kategoriColor[k] || "bg-muted text-foreground";

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Stok Barang</h1>
            <p className="text-xs text-muted-foreground">Kelola stok, masuk, keluar & edit produk jadi.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Stok</p>
            <p className="text-lg font-bold text-purple-600">{totalStok}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setKategoriFilter("semua")}
          className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors capitalize ${
            kategoriFilter === "semua" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          }`}
        >
          Semua
        </button>
        {deleteAllMode ? kategoriList.map((k, i) => (
          <div key={k} className={`relative group animate-shake-loop ${shakingKategori === k ? "bg-destructive/10" : ""}`} style={{ animationDelay: `${i * 0.06}s` }}>
            <button
              onClick={() => handleDeleteAllConfirm(k)}
              title={k}
              className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                deleteAllTarget === k ? "bg-destructive/20 text-destructive border-destructive" : "bg-muted text-muted-foreground border-border hover:bg-destructive/10 hover:text-destructive"
              }`}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          </div>
        )) : kategoriList.map((k) => (
          <div key={k} className={`relative group ${shakingKategori === k ? "animate-shake" : ""}`}>
            <button
              onClick={() => setKategoriFilter(k)}
              title={k}
              className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                kategoriFilter === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
              }`}
            >
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </button>
          </div>
        ))}
        {deleteAllMode ? (
          <button
            onClick={() => { setDeleteAllMode(false); setDeleteAllTarget(null); }}
            title="Batal"
            className="p-2 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        ) : (
          <button
            onClick={() => setIsKategoriModalOpen(true)}
            title="Tambah Kategori"
            className="p-2 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Plus size={12} />
          </button>
        )}
        {kategoriList.length > 0 && !deleteAllMode && (
          <button
            onClick={handleDeleteAllKategori}
            title="Hapus Kategori"
            className="p-2 text-xs font-medium rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded-lg flex items-center gap-2 text-[11px]">
          <CheckCircle2 size={12} /><span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-2 sm:left-2.5 top-1.5 sm:top-2 text-muted-foreground" />
          <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs border border-input rounded-lg bg-background focus:ring-1 focus:ring-ring outline-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} title="Export PDF" className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 bg-muted text-muted-foreground border border-border text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap">
            <Download size={12} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => setIsNewModalOpen(true)} title="Produk Baru" className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 bg-primary text-primary-foreground text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus size={12} /> <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="min-h-[110px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <PackagePlus size={18} className="mb-1" />
          <span className="font-medium text-[11px]">Produk Baru</span>
        </button>

        {produkFiltered.map((item: any) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-2.5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-muted-foreground">{item.code}</span>
              <div className="flex gap-1 items-center">
                <button onClick={() => openAction(item, "edit")} className="text-muted-foreground hover:text-foreground"><Edit2 size={10} /></button>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${getKategoriColor(item.kategori)}`}>
                  {item.kategori?.toUpperCase() || item.brand || "PRODUK"}
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-[11px] leading-snug line-clamp-2 flex-1" title={item.name}>{item.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {item.brand && <span className="text-[9px] text-muted-foreground">{item.brand}</span>}
              {item.size && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Size {item.size}</span>}
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[9px] text-muted-foreground">Stok ({item.satuan || "pcs"})</p>
                <p className={`text-sm font-bold ${item.stock === 0 ? "text-destructive" : "text-foreground"}`}>{item.stock}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openAction(item, "keluar")} disabled={item.stock === 0} className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 py-1 rounded transition-colors flex items-center justify-center gap-1 text-[10px] font-medium">
                  <Minus size={10} /> Out
                </button>
                <button onClick={() => openAction(item, "masuk")} className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 py-1 rounded transition-colors flex items-center justify-center gap-1 text-[10px] font-medium">
                  <Plus size={10} /> In
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {produkFiltered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">Tidak ada produk ditemukan.</div>
      )}

      {/* Tambah Kategori Modal */}
      {isKategoriModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold text-sm text-foreground">Tambah Kategori</h2>
              <button onClick={() => setIsKategoriModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddKategori} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nama Kategori</label>
                <input type="text" required placeholder="Contoh: sandal, sepatu, dll" value={newKategoriName} onChange={(e) => setNewKategoriName(e.target.value)} className={inputClass} />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsKategoriModalOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tambah Produk Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold text-sm text-foreground">Tambah Produk</h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleNew} className="p-4 space-y-3">
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <div><label className="block text-xs font-medium text-foreground mb-1">Nama Produk</label><input type="text" required placeholder="Contoh: Sandal X" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-foreground mb-1">Size</label><input type="text" placeholder="40" value={newSize} onChange={(e) => setNewSize(e.target.value)} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium text-foreground mb-1">Kode</label><input type="text" placeholder="SJ-XX-001" value={newCode} onChange={(e) => setNewCode(e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-foreground mb-1">Stok</label><input type="text" inputMode="numeric" pattern="[0-9]*" required placeholder="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} className={inputClass} /></div>
                <div><label className="block text-xs font-medium text-foreground mb-1">Satuan</label><input type="text" required placeholder="pcs" value={newSatuan} onChange={(e) => setNewSatuan(e.target.value)} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Kategori</label>
                  <select value={newKategori} onChange={(e) => setNewKategori(e.target.value)} className={inputClass}>
                    {kategoriList.map((k) => (
                      <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-foreground mb-1">Merek</label><input type="text" placeholder="Weidenmann" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} className={inputClass} /></div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsNewModalOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (In / Out / Edit) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className={`px-4 py-3 border-b border-border flex justify-between items-center ${actionType === "masuk" ? "bg-primary/5" : actionType === "keluar" ? "bg-destructive/5" : "bg-muted/30"}`}>
              <h2 className="font-semibold text-sm text-foreground">
                {actionType === "masuk" ? "Barang Masuk (Produksi)" : actionType === "keluar" ? "Barang Keluar (Kirim)" : "Edit Produk"}
              </h2>
              <button onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleTransaction} className="p-4 space-y-3">
              {actionType === "edit" ? (
                <>
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Nama Produk</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Size</label><input type="text" placeholder="40" value={editSize} onChange={(e) => setEditSize(e.target.value)} className={inputClass} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Kode</label><input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Satuan</label><input type="text" required value={editSatuan} onChange={(e) => setEditSatuan(e.target.value)} className={inputClass} /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-foreground mb-1">Merek</label><input type="text" placeholder="Weidenmann" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className={inputClass} /></div>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-foreground">{selectedItem.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sisa Stok: <strong className="text-foreground">{selectedItem.stock} {selectedItem.satuan || "pcs"}</strong></p>
                  </div>
                  <div><label className="block text-xs font-medium text-foreground mb-1">Jumlah</label><input type="text" inputMode="numeric" pattern="[0-9]*" required autoFocus placeholder="Contoh: 10" value={txQty} onChange={(e) => setTxQty(e.target.value)} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Tanggal</label><input type="date" required value={txTanggal} onChange={(e) => setTxTanggal(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Jam</label><input type="time" required value={txJam} onChange={(e) => setTxJam(e.target.value)} className={inputClass} /></div>
                  </div>
                  {actionType === "keluar" && (
                    <div><label className="block text-xs font-medium text-foreground mb-1">Tujuan / Keterangan</label><input type="text" placeholder="Contoh: Kirim ke Distributor" value={txTujuan} onChange={(e) => setTxTujuan(e.target.value)} className={inputClass} /></div>
                  )}
                </>
              )}
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setSelectedItem(null)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className={`flex-1 font-medium text-xs px-4 py-2 rounded-md ${actionType === "keluar" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
