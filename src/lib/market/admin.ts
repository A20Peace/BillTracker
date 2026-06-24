/**
 * Who may edit market benchmarks.
 *
 * If BENCHMARK_ADMIN_EMAIL is set, only that account can edit. If unset
 * (typical single-user/personal deployment), any authenticated user can.
 *
 * Server-only (reads a non-public env var). Do not import from client code.
 */
export function isBenchmarkAdmin(email: string | null | undefined): boolean {
  const admin = process.env.BENCHMARK_ADMIN_EMAIL?.trim().toLowerCase();
  if (!admin) return true;
  return Boolean(email) && email!.toLowerCase() === admin;
}
