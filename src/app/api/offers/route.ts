import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { ApplicationStatus, Offer } from "@/db/schema";

function mapRow(row: Record<string, unknown>): Offer {
  return {
    id: row["id"] as number,
    sessionId: row["session_id"] as number | null,
    title: row["title"] as string,
    company: row["company"] as string,
    location: row["location"] as string | null,
    country: row["country"] as string | null,
    source: row["source"] as string | null,
    sourceUrl: row["source_url"] as string | null,
    description: row["description"] as string | null,
    requirements: row["requirements"] as string | null,
    matchScore: row["match_score"] as number | null,
    matchReason: row["match_reason"] as string | null,
    status: row["status"] as ApplicationStatus | null,
    adaptedCv: row["adapted_cv"] as string | null,
    coverLetter: row["cover_letter"] as string | null,
    linkedinMessage: row["linkedin_message"] as string | null,
    aiAnalysis: row["ai_analysis"] as string | null,
    postedAt: row["posted_at"] as string | null,
    deadline: row["deadline"] as string | null,
    createdAt: row["created_at"] as Date | null,
    updatedAt: row["updated_at"] as Date | null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ApplicationStatus | null;
    const sessionId = searchParams.get("sessionId");

    const pool = await getPool();
    const request = pool.request();

    let whereClause = "WHERE 1=1";
    if (status) {
      request.input("status", sql.NVarChar(30), status);
      whereClause += " AND status = @status";
    }
    if (sessionId) {
      request.input("sessionId", sql.Int, parseInt(sessionId));
      whereClause += " AND session_id = @sessionId";
    }

    const result = await request.query(
      `SELECT TOP 100 * FROM offers ${whereClause} ORDER BY match_score DESC`
    );

    return NextResponse.json(result.recordset.map((r) => mapRow(r as Record<string, unknown>)));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
