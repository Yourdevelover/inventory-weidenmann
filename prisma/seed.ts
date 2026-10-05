// Seed default items ke Supabase
// Jalankan: npx tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_ITEMS = [
  { name: "Tali Sepatu Hitam 120cm", code: "BB-001", stock: 50, satuan: "meter", type: "bahan" as const, kategori: "bahan" as const },
  { name: "Sol Karet Size 40", code: "BB-002", stock: 10, satuan: "pcs", type: "bahan" as const, kategori: "bahan" as const },
  { name: "Lem Sepatu Super", code: "BB-003", stock: 200, satuan: "ml", type: "bahan" as const, kategori: "bahan" as const },
  { name: "Sandal Weidenmann Colorado 40", code: "SJ-WD-040", stock: 120, satuan: "pcs", type: "produk" as const, kategori: "sandal" as const, brand: "Weidenmann" },
  { name: "Sandal Ardiles Casual 41", code: "SJ-AD-041", stock: 85, satuan: "pcs", type: "produk" as const, kategori: "sandal" as const, brand: "Ardiles" },
  { name: "Sepatu Weidenmann Runner 42", code: "SP-WD-042", stock: 60, satuan: "pcs", type: "produk" as const, kategori: "sepatu" as const, brand: "Weidenmann" },
  { name: "Sepatu Eagle Sport 40", code: "SP-EG-040", stock: 45, satuan: "pcs", type: "produk" as const, kategori: "sepatu" as const, brand: "Eagle" },
];

async function main() {
  const count = await prisma.item.count();
  if (count > 0) {
    console.log(`Database sudah ada ${count} items, skip seed.`);
    return;
  }

  for (const item of DEFAULT_ITEMS) {
    await prisma.item.create({
      data: {
        ...item,
        transactions: {
          create: {
            itemName: item.name,
            itemCode: item.code,
            satuan: item.satuan,
            type: "masuk",
            quantity: item.stock,
            tanggal: new Date().toISOString().slice(0, 10),
            jam: new Date().toTimeString().slice(0, 5),
            stokSebelum: 0,
            stokSesudah: item.stock,
          },
        },
      },
    });
  }

  console.log(`✓ ${DEFAULT_ITEMS.length} items berhasil di-seed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
