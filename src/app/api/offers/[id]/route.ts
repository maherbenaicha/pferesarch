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
      .query("SELECT TOP 1 * FROM offers WHERE id = @id");

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(mapRow(result.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      status?: ApplicationStatus;
      notes?: string;
      adaptedCv?: string;
      coverLetter?: string;
      linkedinMessage?: string;
    };

    const pool = await getPool();
    const request = pool.request();
    request.input("id", sql.Int, parseInt(id));

    const fields: string[] = ["updated_at = GETDATE()"];
    if (body.status !== undefined) {
      request.input("status", sql.NVarChar(30), body.status);
      fields.push("status = @status");
    }
    if (body.notes !== undefined) {
      request.input("notes", sql.NVarChar(sql.MAX), body.notes);
      fields.push("notes = @notes");
    }
    if (body.adaptedCv !== undefined) {
      request.input("adaptedCv", sql.NVarChar(sql.MAX), body.adaptedCv);
      fields.push("adapted_cv = @adaptedCv");
    }
    if (body.coverLetter !== undefined) {
      request.input("coverLetter", sql.NVarChar(sql.MAX), body.coverLetter);
      fields.push("cover_letter = @coverLetter");
    }
    if (body.linkedinMessage !== undefined) {
      request.input("linkedinMessage", sql.NVarChar(sql.MAX), body.linkedinMessage);
      fields.push("linkedin_message = @linkedinMessage");
    }

    const result = await request.query(
      `UPDATE offers SET ${fields.join(", ")} OUTPUT INSERTED.* WHERE id = @id`
    );
    return NextResponse.json(mapRow(result.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
