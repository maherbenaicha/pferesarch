import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { SearchSession, SearchStatus } from "@/db/schema";

function mapRow(row: Record<string, unknown>): SearchSession {
  return {
    id: row["id"] as number,
    status: row["status"] as SearchStatus | null,
    offersFound: row["offers_found"] as number | null,
    offersAnalyzed: row["offers_analyzed"] as number | null,
    sources: row["sources"] as string | null,
    log: row["log"] as string | null,
    startedAt: row["started_at"] as Date | null,
    finishedAt: row["finished_at"] as Date | null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, parseInt(id))
      .query("SELECT TOP 1 * FROM search_sessions WHERE id = @id");

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(mapRow(result.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
