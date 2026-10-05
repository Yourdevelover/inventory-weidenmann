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

export type Category = {
  id?: number;
  name: string;
  createdAt?: string;
};

let cachedCategories: Category[] | null = null;
let categoriesRequest: Promise<Category[]> | null = null;

type StockContextValue = {
  items: StockItem[];
  transactions: Transaction[];
  targets: Target[];
  categories: Category[];
  loading: boolean;
  categoriesLoading: boolean;
  dataError: string | null;
  categoriesError: string | null;
  refresh: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategory: (name: string) => Promise<Category>;
  deleteCategory: (name: string) => Promise<void>;
  removeCategoryFromState: (kategori: string) => void;
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
  addTarget: (target: Omit<Target, "id" | "realisasi">) => Promise<Target>;
  updateTarget: (id: number, updates: Partial<Target>) => Promise<Target>;
  deleteTarget: (id: number) => Promise<void>;
  applyStockLoss: (transaction: Transaction) => void;
};

const StockContext = createContext<StockContextValue | null>(null);

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: unknown } | null;
    throw new Error(typeof body?.error === "string" ? body.error : `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function loadCategories(force = false): Promise<Category[]> {
  if (!force && cachedCategories) return Promise.resolve(cachedCategories);
  if (categoriesRequest) return categoriesRequest;

  categoriesRequest = fetchJSON<Category[]>("/api/kategori", { cache: "no-store" })
    .then((categories) => {
      cachedCategories = categories;
      return categories;
    })
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const refresh = async () => {
    const results = await Promise.allSettled([
      fetchJSON<StockItem[]>("/api/items"),
      fetchJSON<Transaction[]>("/api/transactions"),
      fetchJSON<Target[]>("/api/targets"),
      loadCategories(),
    ] as const);

    if (results[0].status === "fulfilled") setItems(results[0].value);
    if (results[1].status === "fulfilled") setTransactions(results[1].value);
    if (results[2].status === "fulfilled") setTargets(results[2].value);
    if (results[3].status === "fulfilled") {
      setCategories(results[3].value);
      setCategoriesError(null);
    } else {
      setCategoriesError("Kategori gagal dimuat dari database.");
    }
    setCategoriesLoading(false);

    const failures = results.flatMap((result, index) =>
      result.status === "rejected" ? [["barang", "transaksi", "target produksi"][index]] : []
    );
    setDataError(
      failures.length
        ? `Data ${failures.join(", ")} gagal dimuat. Periksa koneksi database dan pastikan schema sudah diterapkan.`
        : null
    );
    setLoading(false);
  };

  const removeCategoryFromState = (kategori: string) => {
    const removedIds = new Set(items.filter((item) => item.kategori === kategori).map((item) => item.id));
    setItems((current) => current.filter((item) => item.kategori !== kategori));
    setTransactions((current) => current.filter((transaction) => !removedIds.has(transaction.itemId)));
    setTargets((current) => current.filter((target) => target.kategori !== kategori));
  };

  const refreshCategories = async () => {
    setCategoriesLoading(true);
    try {
      const rows = await loadCategories(true);
      setCategories(rows);
      setCategoriesError(null);
    } catch {
      setCategoriesError("Kategori gagal dimuat dari database.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    const category = await fetchJSON<Category>("/api/kategori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    cachedCategories = [...(cachedCategories ?? []), category]
      .filter((entry, index, all) => all.findIndex((candidate) => candidate.name === entry.name) === index);
    setCategories((current) => current.some((entry) => entry.name === category.name)
      ? current
      : [...current, category]);
    setCategoriesError(null);
    return category;
  };

  const deleteCategory = async (name: string) => {
    await fetchJSON(`/api/kategori?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    cachedCategories = (cachedCategories ?? []).filter((category) => category.name !== name);
    setCategories((current) => current.filter((category) => category.name !== name));
    removeCategoryFromState(name);
  };

  const applyStockLoss = (transaction: Transaction) => {
    setTransactions((current) => [transaction, ...current]);
    setItems((current) => current.map((item) => item.id === transaction.itemId
      ? { ...item, stock: transaction.stokSesudah }
      : item));
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
    const result = await fetchJSON<{ item: StockItem; initialTransaction: Transaction | null }>("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, stock, satuan, type, kategori, brand, model, size }),
    });
    setItems((current) => [result.item, ...current]);
    if (result.initialTransaction) {
      setTransactions((current) => [result.initialTransaction!, ...current]);
    }
    return result.item;
  };

  const recordMasuk = async (itemId: number, quantity: number, tanggal: string, jam: string) => {
    const transaction = await fetchJSON<Transaction>("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, type: "masuk", quantity, tanggal, jam }),
    });
    setTransactions((current) => [transaction, ...current]);
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, stock: transaction.stokSesudah } : item));
  };

  const recordKeluar = async (itemId: number, quantity: number, tanggal: string, jam: string, tujuan: string) => {
    const transaction = await fetchJSON<Transaction>("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, type: "keluar", quantity, tanggal, jam, tujuan }),
    });
    setTransactions((current) => [transaction, ...current]);
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, stock: transaction.stokSesudah } : item));
  };

  const setStock = async (id: number, stock: number) => {
    const item = await fetchJSON<StockItem>(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    setItems((current) => current.map((existing) => existing.id === id ? item : existing));
  };

  const removeStock = async (id: number, qty: number) =>
    recordKeluar(id, qty, new Date().toISOString().slice(0, 10), new Date().toTimeString().slice(0, 5), "Keluar");

  const updateItem = async (id: number, updates: Partial<StockItem>) => {
    const item = await fetchJSON<StockItem>(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setItems((current) => current.map((existing) => existing.id === id ? item : existing));
  };

  const deleteItem = async (id: number) => {
    await fetchJSON(`/api/items/${id}`, { method: "DELETE" });
    setItems((current) => current.filter((item) => item.id !== id));
    setTransactions((current) => current.filter((transaction) => transaction.itemId !== id));
    setTargets((current) => current.filter((target) => target.itemId !== id));
  };

  const addTarget = async (target: Omit<Target, "id" | "realisasi">) => {
    const created = await fetchJSON<Target>("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    });
    setTargets((current) => [created, ...current]);
    return created;
  };

  const updateTarget = async (id: number, updates: Partial<Target>) => {
    const updated = await fetchJSON<Target>(`/api/targets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setTargets((current) => current.map((target) => target.id === id ? updated : target));
    return updated;
  };

  const deleteTarget = async (id: number) => {
    await fetchJSON(`/api/targets/${id}`, { method: "DELETE" });
    setTargets((current) => current.filter((target) => target.id !== id));
  };

  return (
    <StockContext.Provider
      value={{ items, transactions, targets, categories, loading, categoriesLoading, dataError, categoriesError, refresh, refreshCategories, addCategory, deleteCategory, removeCategoryFromState, addItem, recordMasuk, recordKeluar, setStock, removeStock, updateItem, deleteItem, addTarget, updateTarget, deleteTarget, applyStockLoss }}
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
