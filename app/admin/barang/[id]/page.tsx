import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

export default async function DetailBarang({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();

  const transactions = await prisma.transaction.findMany({
    where: { itemId: item.id },
    orderBy: { id: "desc" },
  });

  const kategoriLabel = item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1);
  const isKritis = item.stock <= 20;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/barang" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Kode: {item.code} | Kategori: {kategoriLabel}{item.brand ? ` | Merek: ${item.brand}` : ""}{item.size ? ` | Size: ${item.size}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Informasi Stok</h2>
            <div className="flex items-end gap-2 mb-1">
              <span className={`text-4xl font-bold ${isKritis ? "text-destructive" : "text-foreground"}`}>{item.stock}</span>
              <span className="text-muted-foreground pb-1">{item.satuan}</span>
            </div>
            {isKritis && (
              <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded mt-3 border border-destructive/20">
                <AlertCircle size={14} /> Stok di bawah batas minimum (20 {item.satuan})
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <button className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-md hover:opacity-90 transition-opacity">
                Koreksi Stok (Stock Opname)
              </button>
              <button className="w-full bg-card border border-border text-foreground text-sm font-medium py-2.5 rounded-md hover:bg-muted transition-colors flex justify-center items-center gap-2">
                <Edit2 size={14} /> Edit Data Master
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Riwayat Transaksi</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border text-muted-foreground">
                    <th className="py-3 px-5 font-medium">Tanggal</th>
                    <th className="py-3 px-5 font-medium">Jenis</th>
                    <th className="py-3 px-5 font-medium">Jumlah</th>
                    <th className="py-3 px-5 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">Belum ada transaksi.</td>
                    </tr>
                  ) : transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/50">
                      <td className="py-3 px-5">{t.tanggal}, {t.jam}</td>
                      <td className="py-3 px-5">
                        <span className={t.type === "keluar" ? "text-destructive font-medium" : "text-emerald-600 font-medium"}>
                          {t.type === "keluar" ? "Keluar" : "Masuk"}
                        </span>
                      </td>
                      <td className="py-3 px-5">{t.type === "keluar" ? "-" : "+"}{t.quantity}</td>
                      <td className="py-3 px-5">{t.tujuan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}