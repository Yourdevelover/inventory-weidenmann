"use client";

import { useState } from "react";
import { Plus, Minus, Edit2, X, CheckCircle2, PackagePlus, Search, Download } from "lucide-react";
import { useStock } from "@/components/StockContext";
import { exportToPdf } from "@/lib/pdf";

export default function StafBarangMasuk() {
  const { items, addItem, recordMasuk, recordKeluar, updateItem } = useStock();
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newSatuan, setNewSatuan] = useState("pcs");

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionType, setActionType] = useState<"masuk"|"keluar"|"edit"|null>(null);
  
  // Transaction states
  const [txQty, setTxQty] = useState("");
  const [txTanggal, setTxTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [txJam, setTxJam] = useState(new Date().toTimeString().slice(0, 5));
  const [txTujuan, setTxTujuan] = useState("");
  
  // Edit states
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSatuan, setEditSatuan] = useState("");

  const bahan = items.filter((i: any) => i.kategori === "bahan" && i.name.toLowerCase().includes(search.toLowerCase()));
  const totalStok = bahan.reduce((s: number, i: any) => s + i.stock, 0);

  const handleExport = () => {
    const head = ["Kode", "Nama", "Satuan", "Stok"];
    const body = bahan.map((i: any) => [i.code, i.name, i.satuan, String(i.stock)]);
    exportToPdf("Stok Bahan", head, body, "stok-bahan.pdf");
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStock) return;
    addItem(newName, newCode || "-", parseInt(newStock), newSatuan, "bahan", "bahan");
    setSuccessMsg(`"${newName}" ditambahkan!`);
    setIsNewItemModalOpen(false);
    setNewName(""); setNewCode(""); setNewStock(""); setNewSatuan("pcs");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txQty || !selectedItem) return;
    const qty = parseInt(txQty);
    
    if (actionType === "masuk") {
      recordMasuk(selectedItem.id, qty, txTanggal, txJam);
      setSuccessMsg(`Stok ${selectedItem.name} +${qty}`);
    } else if (actionType === "keluar") {
      if (qty > selectedItem.stock) { alert("Jumlah melebihi stok!"); return; }
      recordKeluar(selectedItem.id, qty, txTanggal, txJam, txTujuan || "Produksi");
      setSuccessMsg(`Stok ${selectedItem.name} -${qty}`);
    } else if (actionType === "edit") {
      updateItem(selectedItem.id, { name: editName, code: editCode, satuan: editSatuan });
      setSuccessMsg(`Data ${editName} diperbarui`);
    }
    
    setSelectedItem(null);
    setActionType(null);
    setTxQty(""); setTxTujuan("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };
  
  const openAction = (item: any, type: "masuk"|"keluar"|"edit") => {
    setSelectedItem(item);
    setActionType(type);
    if(type === "edit") {
      setEditName(item.name);
      setEditCode(item.code);
      setEditSatuan(item.satuan);
    } else {
      setTxTanggal(new Date().toISOString().slice(0, 10));
      setTxJam(new Date().toTimeString().slice(0, 5));
    }
  }

  const inputClass = "w-full border border-input rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-ring outline-none";

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Stok Bahan</h1>
            <p className="text-xs text-muted-foreground">Kelola stok, masuk, keluar & edit bahan baku.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Stok</p>
            <p className="text-lg font-bold text-primary">{totalStok}</p>
          </div>
        </div>
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
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <button
          onClick={() => setIsNewItemModalOpen(true)}
          className="min-h-[110px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <PackagePlus size={18} className="mb-1" />
          <span className="font-medium text-[11px]">Bahan Baru</span>
        </button>

        {bahan.map((item: any) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-2.5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-muted-foreground">{item.code}</span>
              <div className="flex gap-1">
                <button onClick={()=>openAction(item, "edit")} className="text-muted-foreground hover:text-foreground"><Edit2 size={10} /></button>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">BAHAN</span>
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-[11px] leading-snug line-clamp-2 flex-1" title={item.name}>{item.name}</h3>
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[9px] text-muted-foreground">Stok ({item.satuan})</p>
                <p className="text-sm font-bold text-foreground">{item.stock}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openAction(item, "keluar")} disabled={item.stock===0} className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 py-1 rounded transition-colors flex items-center justify-center gap-1 text-[10px] font-medium">
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

      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="font-semibold text-sm text-foreground">Tambah Bahan Baku</h2>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateNewItem} className="p-4 space-y-3">
              <div><label className="block text-xs font-medium text-foreground mb-1">Nama Bahan Baku</label><input type="text" required placeholder="Contoh: Kain Canvas Hitam" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><label className="block text-xs font-medium text-foreground mb-1">Kode</label><input type="text" placeholder="BB-004" value={newCode} onChange={(e) => setNewCode(e.target.value)} className={inputClass} /></div>
                <div className="col-span-1"><label className="block text-xs font-medium text-foreground mb-1">Stok</label><input type="text" inputMode="numeric" pattern="[0-9]*" required placeholder="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} className={inputClass} /></div>
                <div className="col-span-1"><label className="block text-xs font-medium text-foreground mb-1">Satuan</label><input type="text" required placeholder="pcs" value={newSatuan} onChange={(e) => setNewSatuan(e.target.value)} className={inputClass} /></div>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsNewItemModalOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-sm rounded-xl shadow-xl border border-border overflow-hidden">
            <div className={`px-4 py-3 border-b border-border flex justify-between items-center ${actionType==='masuk'?'bg-primary/5':actionType==='keluar'?'bg-destructive/5':'bg-muted/30'}`}>
              <h2 className="font-semibold text-sm text-foreground">
                {actionType==='masuk' ? 'Barang Masuk (Tambah)' : actionType==='keluar' ? 'Barang Keluar (Pakai)' : 'Edit Barang'}
              </h2>
              <button onClick={() => setSelectedItem(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleTransaction} className="p-4 space-y-3">
              {actionType === 'edit' ? (
                <>
                  <div><label className="block text-xs font-medium text-foreground mb-1">Nama Bahan</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Kode</label><input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Satuan</label><input type="text" required value={editSatuan} onChange={(e) => setEditSatuan(e.target.value)} className={inputClass} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border">
                    <p className="text-xs font-semibold text-foreground">{selectedItem.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Sisa Stok: <strong className="text-foreground">{selectedItem.stock} {selectedItem.satuan}</strong></p>
                  </div>
                  <div><label className="block text-xs font-medium text-foreground mb-1">Jumlah</label><input type="text" inputMode="numeric" pattern="[0-9]*" required autoFocus placeholder="Contoh: 10" value={txQty} onChange={(e) => setTxQty(e.target.value)} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-medium text-foreground mb-1">Tanggal</label><input type="date" required value={txTanggal} onChange={(e) => setTxTanggal(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-xs font-medium text-foreground mb-1">Jam</label><input type="time" required value={txJam} onChange={(e) => setTxJam(e.target.value)} className={inputClass} /></div>
                  </div>
                  {actionType === 'keluar' && (
                    <div><label className="block text-xs font-medium text-foreground mb-1">Tujuan / Keterangan</label><input type="text" placeholder="Contoh: Ke Produksi" value={txTujuan} onChange={(e) => setTxTujuan(e.target.value)} className={inputClass} /></div>
                  )}
                </>
              )}
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setSelectedItem(null)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className={`flex-1 font-medium text-xs px-4 py-2 rounded-md ${actionType==='keluar'?'bg-destructive text-destructive-foreground':'bg-primary text-primary-foreground'}`}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
