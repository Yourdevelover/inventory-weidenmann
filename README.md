# Sistem Manajemen Stok dan Produksi Weidenmann

Aplikasi web untuk mengelola persediaan bahan baku dan barang jadi, transaksi barang masuk/keluar, target produksi, laporan cacat, serta peringatan stok rendah.

## Fitur

- Dashboard ringkasan stok, target, dan produksi harian.
- Pengelolaan data barang, kategori, dan detail produk.
- Pencatatan transaksi barang masuk dan keluar.
- Pengelolaan target produksi dan laporan barang cacat.
- Notifikasi stok rendah untuk admin dan staf.
- Penyimpanan data PostgreSQL melalui Prisma dan Supabase.

## Teknologi

- Next.js 16 dengan App Router
- React 19 dan TypeScript
- Prisma ORM dan PostgreSQL
- Supabase JavaScript client
- Tailwind CSS

## Persiapan

Siapkan Node.js yang mendukung Next.js 16, npm, dan database PostgreSQL yang dapat diakses aplikasi (misalnya Supabase). Pasang dependensi:

```bash
npm install
```

Buat file `.env.local` di root proyek dan isi dengan kredensial lingkungan Anda:

```dotenv
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

`DATABASE_URL` digunakan Prisma untuk koneksi aplikasi, sedangkan `DIRECT_URL` digunakan untuk koneksi langsung ke PostgreSQL. Siapkan tabel berdasarkan schema Prisma:

```bash
npx prisma generate
npx prisma db push
```

Untuk mengisi data contoh secara opsional:

```bash
npx tsx prisma/seed.ts
```

## Menjalankan Aplikasi

Jalankan server pengembangan:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk pemeriksaan lint dan build produksi:

```bash
npm run lint
npm run build
```

## Struktur Utama

```text
.
├── app/
│   ├── admin/
│   │   ├── barang/[id]/
│   │   ├── laporan/
│   │   ├── notifikasi/
│   │   └── produksi/
│   ├── api/
│   │   ├── items/[id]/
│   │   ├── kategori/
│   │   ├── laporan-cacat/[id]/
│   │   ├── targets/[id]/
│   │   └── transactions/
│   ├── login/
│   └── staf/
│       ├── data-barang/[id]/
│       ├── keluar/
│       ├── masuk/
│       ├── notifikasi/
│       └── produksi/
├── components/          # Layout, navigasi, tema, dan state stok
├── lib/                 # Koneksi Prisma, Supabase, dan utilitas PDF
├── prisma/
│   ├── schema.prisma    # Model dan relasi database
│   └── seed.ts          # Data awal opsional
├── public/              # Aset statis
├── scripts/             # Skrip utilitas proyek
├── .env.local           # Variabel lingkungan (buat sendiri, tidak di-commit)
├── package.json
└── README.md
```
