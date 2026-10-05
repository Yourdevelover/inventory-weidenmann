import { PrismaClient } from "@prisma/client";

// Singleton pattern — cegah multiple instance di Next.js dev mode (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ponytail: fast-fail saat DB unreachable. Upgrade: hapus saat DB connect.
export let dbDown = false;
export async function dbFast<T>(p: Promise<T>, ms = 2000): Promise<T | null> {
  if (dbDown) return null;
  const safe = p.then(
    (v) => ({ ok: true as const, v }),
    () => ({ ok: false as const })
  );
  const timer = new Promise<{ ok: false }>((r) => setTimeout(() => r({ ok: false }), ms));
  const res = await Promise.race([safe, timer]);
  if (!res.ok) { dbDown = true; setTimeout(() => { dbDown = false; }, 30000); return null; }
  return res.v;
}
