"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Search, AlertCircle, Plus, X, PackagePlus, Trash2, Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useStock } from "@/components/StockContext";
import { exportToPdf } from "@/lib/pdf";

export default function DataBarang() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat data barang...</p>}>
      <DataBarangContent />
    </Suspense>
  );
}

function DataBarangContent() {
  const searchParams = useSearchParams();
  const { items, addItem, deleteItem, refresh } = useStock();
  const [selectionDismissed, setSelectionDismissed] = useState(false);

  const handleExport = () => {
    const head = displayedTab === "bahan" ? ["Kode", "Nama", "Satuan", "Stok"] : ["Kode", "Nama", "Merek", "Size", "Satuan", "Stok"];
    const body = filtered.map((i: any) =>
      displayedTab === "bahan"
        ? [i.code, i.name, i.satuan, String(i.stock)]
        : [i.code, i.name, i.brand || "-", i.size || "-", i.satuan, String(i.stock)]
    );
    exportToPdf(`Data Barang — ${displayedTab}`, head, body, `admin-data-barang-${displayedTab}.pdf`);
  };
  const [activeTab, setActiveTab] = useState<string>("sandal");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState("");
  const [kategoriList, setKategoriList] = useState<string[]>(["sandal", "sepatu", "bahan"]);
  const [shakingKategori, setShakingKategori] = useState<string | null>(null);
  const [deleteAllMode, setDeleteAllMode] = useState(false);
  const [deleteAllTarget, setDeleteAllTarget] = useState<string | null>(null);

  // form state
  const [newNama, setNewNama] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSatuan, setNewSatuan] = useState("pcs");
  const [newStok, setNewStok] = useState("");
  const [newKategori, setNewKategori] = useState<string>(activeTab);

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

  const requestedItemId = Number(searchParams.get("item"));
  const requestedItem = Number.isSafeInteger(requestedItemId)
    ? (items || []).find((item: { id: number }) => item.id === requestedItemId)
    : undefined;
  const selectedItem = selectionDismissed ? undefined : requestedItem;
  const displayedTab = selectedItem?.kategori ?? activeTab;
  const displayedSearch = selectedItem?.code ?? search;

  const tabs = kategoriList.map(k => ({
    key: k,
    label: k.charAt(0).toUpperCase() + k.slice(1),
    color: "text-foreground border-foreground",
    badge: "bg-muted text-foreground",
  }));

  const filtered = (items || []).filter((i: any) => {
    const matchTab = i.kategori === displayedTab;
    const matchSearch = i.name.toLowerCase().includes(displayedSearch.toLowerCase()) ||
      i.code.toLowerCase().includes(displayedSearch.toLowerCase());
    return matchTab && matchSearch;
  });

  const currentBadge = tabs.find(t => t.key === activeTab)?.badge || "";
  const totalStok = filtered.reduce((s: number, i: any) => s + i.stock, 0);

  const openModal = () => {
    setNewKategori(displayedTab);
    setNewNama(""); setNewSize(""); setNewCode("");
    setNewBrand(""); setNewSatuan("pcs"); setNewStok("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newStok) return;
    const kategoriFinal = newKategori;
    const type = kategoriFinal === "bahan" ? "bahan" : "produk";
    const fullName = newNama;
    addItem(fullName, newCode || "-", parseInt(newStok), newSatuan, type, kategoriFinal, newBrand || undefined, undefined, newSize || undefined);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus "${name}"? Data tidak bisa dikembalikan.`)) return;
    try {
      await deleteItem(id);
    } catch (e: any) {
      alert(e.message || "Gagal menghapus");
    }
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
      setNewKategoriName("");
      setIsKategoriModalOpen(false);
      setActiveTab(k);
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
          if (activeTab === name) setActiveTab(kategoriList[0] || "sandal");
          setDeleteAllMode(false);
          setDeleteAllTarget(null);
        } catch { alert("Gagal hapus"); }
      })();
    }, 450);
  };
  const inputCls = "w-full border border-input rounded-md p-2 text-sm bg-background focus:ring-1 focus:ring-ring outline-none";

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">Data Barang</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Semua data barang gudang pabrik.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Total Stok</p>
            <p className="text-lg font-bold text-foreground">{totalStok}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border px-2 flex-wrap items-center gap-0.5">
          {deleteAllMode ? kategoriList.map((k, i) => (
            <div key={k} className={`flex items-center group animate-shake-loop ${shakingKategori === k ? "bg-destructive/10" : ""}`} style={{ animationDelay: `${i * 0.06}s` }}>
              <button onClick={() => handleDeleteAllConfirm(k)} className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${deleteAllTarget === k ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:text-foreground"}`} title={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            </div>
          )) : tabs.map(tab => (
            <div key={tab.key} className="flex items-center group">
              <button onClick={() => { setSelectionDismissed(true); setActiveTab(tab.key); setSearch(""); }}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${displayedTab === tab.key ? tab.color : "text-muted-foreground hover:text-foreground"}`} title={tab.label}>
                {tab.label}
              </button>
            </div>
          ))}
          {deleteAllMode ? (
            <button onClick={() => { setDeleteAllMode(false); setDeleteAllTarget(null); }} title="Batal" className="ml-2 p-2 text-xs font-medium rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
              <X size={12} />
            </button>
          ) : (
            <button onClick={() => setIsKategoriModalOpen(true)} title="Tambah Kategori" className="ml-2 p-2 text-xs font-medium rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
              <Plus size={12} />
            </button>
          )}
          {kategoriList.length > 0 && !deleteAllMode && (
            <button onClick={handleDeleteAllKategori} title="Hapus Kategori" className="ml-2 p-2 text-xs font-medium rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Search + Aksi */}
        <div className="p-2 sm:p-3 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 sm:left-2.5 top-1.5 sm:top-2 text-muted-foreground" size={14} />
              <input type="text"
                placeholder={`Cari...`}
                value={displayedSearch} onChange={(e) => { setSelectionDismissed(true); setSearch(e.target.value); }}
                className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 text-xs border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} title="Export PDF" className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 bg-muted text-muted-foreground border border-border text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-muted/80 transition-colors whitespace-nowrap">
                <Download size={12} /> <span className="hidden sm:inline">PDF</span>
              </button>
              <button onClick={openModal} title="Tambah Barang" className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 bg-primary text-primary-foreground text-[11px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">
                <Plus size={12} /> <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                <th className="py-2 px-2 sm:px-4 font-medium">Kode</th>
                <th className="py-2 px-2 sm:px-4 font-medium">Nama</th>
                {displayedTab !== "bahan" && <>
                  <th className="py-2 px-2 sm:px-4 font-medium hidden sm:table-cell">Merek</th>
                  <th className="py-2 px-2 sm:px-4 font-medium hidden md:table-cell">Ukuran</th>
                </>}
                <th className="py-2 px-2 sm:px-4 font-medium hidden sm:table-cell">Satuan</th>
                <th className="py-2 px-2 sm:px-4 font-medium text-right">Stok</th>
                <th className="py-2 px-2 sm:px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={displayedTab !== "bahan" ? 6 : 4} className="py-10 text-center text-muted-foreground">
                    Tidak ada data. Klik + untuk menambah barang.
                  </td>
                </tr>
              ) : filtered.map((item: any) => (
                <tr key={item.id} className={`hover:bg-muted/30 transition-colors ${selectedItem?.id === item.id ? "bg-destructive/5" : ""}`}>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 font-mono text-muted-foreground">{item.code}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4">
                    <Link href={`/admin/barang/${item.id}`} className="flex items-center gap-2 hover:underline">
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground">{item.kategori?.toUpperCase()}</span>
                      <p className="font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                    </Link>
                  </td>
                  {displayedTab !== "bahan" && <>
                    <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">{item.brand || "-"}</td>
                    <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden md:table-cell">{item.size || "-"}</td>
                  </>}
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-muted-foreground hidden sm:table-cell">{item.satuan || "pcs"}</td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 font-semibold text-right">
                    {item.stock <= 20 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                        <AlertCircle size={9} /> {item.stock}
                      </span>
                    ) : item.stock}
                  </td>
                  <td className="py-2 sm:py-2.5 px-2 sm:px-4 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-destructive hover:bg-destructive/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={12} /> <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">{filtered.length} item</div>
        )}
      </div>

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
                <input type="text" required placeholder="Contoh: sandal, sepatu, dll" value={newKategoriName} onChange={(e) => setNewKategoriName(e.target.value)} className={inputCls} />
              </div>
              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsKategoriModalOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Barang */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-2">
                <PackagePlus size={16} className="text-primary" />
                <h2 className="font-semibold text-sm text-foreground">Tambah Barang</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">

              {/* Kategori toggle */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Kategori</label>
                <div className="flex gap-1.5 flex-wrap">
                  {kategoriList.map(k => (
                    <button type="button" key={k} onClick={() => setNewKategori(k)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border capitalize transition-colors
                        ${newKategori === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama produk / model + Size (kecil, kanan) */}
              <div className={newKategori !== "bahan" ? "grid grid-cols-[1fr_110px] gap-2" : ""}>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Nama Produk / Model</label>
                  <input type="text" required placeholder={newKategori !== "bahan" ? "Contoh: Sandal Colorado Type A" : "Contoh: Tali Sepatu Hitam"} value={newNama} onChange={e => setNewNama(e.target.value)} className={inputCls} />
                </div>
                {newKategori !== "bahan" && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Size</label>
                    <input type="text" placeholder="40" value={newSize} onChange={e => setNewSize(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              {/* Kode + Merek */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Kode Barang</label>
                  <input type="text" placeholder="BB-001 / SJ-WD-040" value={newCode} onChange={e => setNewCode(e.target.value)} className={inputCls} />
                </div>
                {newKategori !== "bahan" ? (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Merek</label>
                    <input type="text" placeholder="Weidenmann" value={newBrand} onChange={e => setNewBrand(e.target.value)} className={inputCls} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Satuan</label>
                    <input type="text" required placeholder="pcs / kg / roll" value={newSatuan} onChange={e => setNewSatuan(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              {/* Stok + Satuan (produk) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Stok Awal</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" required placeholder="0" value={newStok} onChange={e => setNewStok(e.target.value)} className={inputCls} />
                </div>
                {newKategori !== "bahan" && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Satuan</label>
                    <input type="text" required placeholder="pcs" value={newSatuan} onChange={e => setNewSatuan(e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-muted text-muted-foreground font-medium text-xs px-4 py-2 rounded-md">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-medium text-xs px-4 py-2 rounded-md">Simpan Barang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
