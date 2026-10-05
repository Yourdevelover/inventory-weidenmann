import { PrismaClient } from "@prisma/client";

// Singleton pattern — cegah multiple instance di Next.js dev mode (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function dbFast<T>(query: Promise<T>, timeoutMs = 8000): Promise<T | null> {
  const safe = query.then(
    (value) => ({ ok: true as const, value }),
    () => ({ ok: false as const })
  );
  const timeout = new Promise<{ ok: false }>((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false }), timeoutMs);
    safe.then(() => clearTimeout(timer));
  });
  const result = await Promise.race([safe, timeout]);
  return result.ok ? result.value : null;
}
