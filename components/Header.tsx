"use client";

import Link from "next/link";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useStock } from "./StockContext";
import type { StockItem } from "./StockContext";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const isStaff = pathname.startsWith("/staf");
  const { setTheme, theme } = useTheme();
  const isDark = theme === "dark";
  const { items } = useStock() as { items: StockItem[] };
  const lowStockCount = items.filter((item) => item.stock <= 20).length;
  
  // Format judul header berdasarkan rute aktif
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard Overview";
    if (pathname.includes("/notifikasi")) return "Notifikasi Stok";
    if (pathname.includes("/staf/data-barang")) return "Data Barang Gudang";
    if (pathname.includes("/admin/barang")) return "Manajemen Data Barang";
    if (pathname.includes("/admin/produksi")) return "Perencanaan Produksi";
    if (pathname.includes("/admin/laporan")) return "Laporan Pabrik";
    if (pathname.includes("/staf/masuk")) return "Penerimaan Barang Gudang";
    if (pathname.includes("/staf/keluar")) return "Pengeluaran Barang ke Produksi";
    if (pathname.includes("/staf/produksi")) return "Pelaporan Hasil Produksi";
    return "Sistem Manajemen Gudang & Produksi";
  };

  return (
    <header className="h-14 md:h-16 bg-background border-b border-border px-4 md:px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-muted-foreground hover:text-foreground" aria-label="Buka menu">
          <Menu size={20} />
        </button>
        <h2 className="text-sm font-semibold text-foreground truncate">{getPageTitle()}</h2>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Icons & Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href={isStaff ? "/staf/notifikasi" : "/admin/notifikasi"}
            className="text-muted-foreground hover:text-foreground transition-colors relative p-2"
            aria-label={`Buka notifikasi stok menipis: ${lowStockCount} barang`}
            title="Notifikasi stok menipis"
          >
            <Bell size={18} />
            {lowStockCount > 0 && (
              <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] leading-4 text-center">
                {lowStockCount}
              </span>
            )}
          </Link>
          
          <div className="h-6 w-px bg-border mx-0.5 md:mx-1 hidden sm:block"></div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={`Ganti ke tema ${isDark ? "terang" : "gelap"}`}
            title={`Ganti ke tema ${isDark ? "terang" : "gelap"}`}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
