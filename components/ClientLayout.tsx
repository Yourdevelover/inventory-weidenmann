"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { StockProvider } from "./StockContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

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
            {children}
          </main>
        </div>
      </div>
    </StockProvider>
  );
}
