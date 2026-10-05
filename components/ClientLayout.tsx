"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { StockProvider } from "./StockContext";
import { useStock } from "./StockContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

function DatabaseStatus() {
  const { dataError, refresh } = useStock();

  if (!dataError) return null;

  return (
    <div role="alert" className="mb-4 flex flex-col gap-3 border border-destructive/40 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-destructive">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <p>{dataError}</p>
      </div>
      <button
        type="button"
        onClick={() => void refresh()}
        className="inline-flex shrink-0 items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
      >
        <RefreshCw size={15} />
        Coba lagi
      </button>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        {children}
      </main>
    );
  }

  return (
    <StockProvider>
      <div className="min-h-full flex bg-muted/20 text-foreground font-sans">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-3 sm:p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto">
            <DatabaseStatus />
            {children}
          </main>
        </div>
      </div>
    </StockProvider>
  );
}
