"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Database, ArrowDownToLine, ArrowUpFromLine, Bell,
  ClipboardList, PenTool, BarChart4, LogOut, X
} from "lucide-react";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const isStaff = pathname.startsWith("/staf");
  const isActive = (path: string) => pathname === path;

  const navClass = (path: string) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const content = (
    <>
      <div className="h-14 flex items-center px-4 border-b border-border bg-background shrink-0">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-3">
          <span className="font-bold text-primary-foreground text-lg">W</span>
        </div>
        <span className="font-bold text-base tracking-tight text-foreground">{isStaff ? "Halaman Staf" : "Halaman Admin"}</span>
        <button onClick={onClose} className="ml-auto md:hidden text-muted-foreground hover:text-foreground"><X size={20} /></button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-1">
        {isStaff ? (
          <>
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Staf</p>
            <Link href="/staf/notifikasi" onClick={onClose} className={navClass("/staf/notifikasi")}><Bell size={16} /> Notifikasi</Link>
            <Link href="/staf/data-barang" onClick={onClose} className={navClass("/staf/data-barang")}><Database size={16} /> Data Barang</Link>
            <Link href="/staf/keluar" onClick={onClose} className={navClass("/staf/keluar")}> <ArrowUpFromLine size={16} /> Stok Barang</Link>
            <Link href="/staf/masuk" onClick={onClose} className={navClass("/staf/masuk")}> <ArrowDownToLine size={16} /> Stok Bahan</Link>
            <Link href="/staf/produksi" onClick={onClose} className={navClass("/staf/produksi")}> <PenTool size={16} /> Barang Rusak</Link>
          </>
        ) : (
          <>
            <Link href="/" onClick={onClose} className={navClass("/")}><LayoutDashboard size={16} /> Dashboard</Link>
            <Link href="/admin/notifikasi" onClick={onClose} className={navClass("/admin/notifikasi")}><Bell size={16} /> Notifikasi</Link>
            <Link href="/admin/barang" onClick={onClose} className={navClass("/admin/barang")}><Database size={16} /> Data Barang</Link>
            <Link href="/admin/produksi" onClick={onClose} className={navClass("/admin/produksi")}> <ClipboardList size={16} /> Target Barang</Link>
            <Link href="/admin/laporan" onClick={onClose} className={navClass("/admin/laporan")}><BarChart4 size={16} /> Laporan</Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border bg-background shrink-0">
        <Link href="/login" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut size={16} /> Keluar
        </Link>
      </div>
    </>
  );

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose}></div>}
      <aside className={`fixed inset-y-0 left-0 w-56 bg-background border-r border-border z-40 flex flex-col transition-transform duration-200 md:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{content}</aside>
      <aside className="hidden md:flex w-56 bg-background border-r border-border h-screen flex-col fixed z-20">{content}</aside>
    </>
  );
}
