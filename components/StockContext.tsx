"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Stock item with satuan, kategori, optional brand
export type StockItem = {
  id: number;
  name: string;
  code: string;
  stock: number;
  satuan: string;
  type: "bahan" | "produk";
  kategori: string;
  brand?: string;
  model?: string;
  size?: string;
};

// Transaction log entry
export type Transaction = {
  id: number;
  itemId: number;
  itemName: string;
  itemCode: string;
  satuan: string;
  type: "masuk" | "keluar";
  quantity: number;
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm
  tujuan?: string;
  stokSebelum: number;
  stokSesudah: number;
};

export type Target = {
  id: number;
  itemId: number;
  itemName: string;
  brand: string;
  kategori: string;
  periode: "harian" | "mingguan" | "bulanan";
  jumlah: number;
  realisasi: number;
  createdAt: string;
};

type StockContextValue = {
  items: StockItem[];
  transactions: Transaction[];
  targets: Target[];
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (
    name: string,
    code: string,
    stock: number,
    satuan: string,
    type: "bahan" | "produk",
    kategori: string,
    brand?: string,
    model?: string,
    size?: string
  ) => Promise<unknown>;
  recordMasuk: (itemId: number, quantity: number, tanggal: string, jam: string) => Promise<void>;
  recordKeluar: (itemId: number, quantity: number, tanggal: string, jam: string, tujuan: string) => Promise<void>;
  setStock: (id: number, stock: number) => Promise<void>;
  removeStock: (id: number, qty: number) => Promise<void>;
  updateItem: (id: number, updates: Partial<StockItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
};

const StockContext = createContext<StockContextValue | null>(null);

async function fetchJSON(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase via API
  const refresh = async () => {
    try {
      const [itemsData, txnsData, targetsData] = await Promise.all([
        fetchJSON("/api/items").catch(() => []),
        fetchJSON("/api/transactions").catch(() => []),
        fetchJSON("/api/targets").catch(() => []),
      ]);
      setItems(itemsData);
      setTransactions(txnsData);
      setTargets(targetsData);
    } catch (e) {
      console.error("Gagal load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addItem = async (
    name: string,
    code: string,
    stock: number,
    satuan: string,
    type: "bahan" | "produk",
    kategori: string,
    brand?: string,
    model?: string,
    size?: string
  ) => {
    const newItem = await fetchJSON("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, stock, satuan, type, kategori, brand, model, size }),
    });
    await refresh();
    return newItem;
  };

  const recordMasuk = async (itemId: number, quantity: number, tanggal: string, jam: string) => {
    await fetchJSON("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, type: "masuk", quantity, tanggal, jam }),
    });
    await refresh();
  };

  const recordKeluar = async (itemId: number, quantity: number, tanggal: string, jam: string, tujuan: string) => {
    await fetchJSON("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, type: "keluar", quantity, tanggal, jam, tujuan }),
    });
    await refresh();
  };

  const setStock = async (id: number, stock: number) => {
    await fetchJSON(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    await refresh();
  };

  const removeStock = async (id: number, qty: number) =>
    recordKeluar(id, qty, new Date().toISOString().slice(0, 10), new Date().toTimeString().slice(0, 5), "Keluar");

  const updateItem = async (id: number, updates: Partial<StockItem>) => {
    await fetchJSON(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await refresh();
  };

  const deleteItem = async (id: number) => {
    await fetchJSON(`/api/items/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <StockContext.Provider
      value={{ items, transactions, targets, loading, refresh, addItem, recordMasuk, recordKeluar, setStock, removeStock, updateItem, deleteItem }}
    >
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used inside StockProvider");
  }
  return context;
};
