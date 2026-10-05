import Link from "next/link";
import { ShieldCheck, Users } from "lucide-react";

export default function Login() {
  return (
    <div className="w-full max-w-lg bg-card text-card-foreground p-8 rounded-2xl border border-border shadow-lg animate-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">WEIDENMANN</h1>
        <p className="text-sm text-muted-foreground mt-2">Pilih peran akses Anda untuk masuk ke sistem</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Tombol Login Admin */}
        <Link 
          href="/" 
          className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground text-lg">Admin</h3>
            <p className="text-xs text-muted-foreground mt-1">Manajemen & Laporan</p>
          </div>
        </Link>

        {/* Tombol Login Staf */}
        <Link 
          href="/staf/masuk" 
          className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-border rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground text-lg">Staf</h3>
            <p className="text-xs text-muted-foreground mt-1">Operasional Harian</p>
          </div>
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>Gunakan kredensial yang sesuai dengan divisi Anda.</p>
        <p className="mt-1">&copy; 2026 Pabrik Sepatu Weidenmann</p>
      </div>
    </div>
  );
}
