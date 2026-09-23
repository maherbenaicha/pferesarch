import { getPool } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
