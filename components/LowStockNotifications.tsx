"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useStock } from "./StockContext";
import type { StockItem } from "./StockContext";

export default function LowStockNotifications({ isStaff }: { isStaff: boolean }) {
  const { items } = useStock() as { items: StockItem[] };
  const lowStockItems = items
    .filter((item) => item.stock <= 20)
    .sort((first, second) => first.stock - second.stock);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Notifikasi Stok Menipis</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daftar barang dengan stok 20 atau kurang.</p>
      </div>

      {lowStockItems.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
          Tidak ada barang dengan stok menipis.
        </p>
      ) : (
        <ul className="border-t border-border">
          {lowStockItems.map((item) => (
            <li key={item.id} className="border-b border-border">
              <Link
                href={isStaff ? `/staf/data-barang?item=${item.id}` : `/admin/barang?item=${item.id}`}
                className="flex items-center gap-3 px-2 py-4 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <AlertCircle size={18} className="shrink-0 text-destructive" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
                  <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>Kode: {item.code}</span>
                    <span className="font-semibold text-destructive">Sisa {item.stock} {item.satuan}</span>
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}