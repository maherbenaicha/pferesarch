import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { ApplicationStatus, Application, Offer } from "@/db/schema";

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: row["id"] as number,
    offerId: row["offer_id"] as number | null,
    status: row["status"] as ApplicationStatus | null,
    sentAt: row["sent_at"] as Date | null,
    followUpAt: row["follow_up_at"] as Date | null,
    notes: row["notes"] as string | null,
    response: row["response"] as string | null,
    createdAt: row["created_at"] as Date | null,
    updatedAt: row["updated_at"] as Date | null,
  };
}

function mapOffer(row: Record<string, unknown>): Partial<Offer> {
  return {
    id: row["o_id"] as number,
    title: row["o_title"] as string,
    company: row["o_company"] as string,
    location: row["o_location"] as string | null,
    status: row["o_status"] as ApplicationStatus | null,
    matchScore: row["o_match_score"] as number | null,
  };
}

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 100
        a.id, a.offer_id, a.status, a.sent_at, a.follow_up_at,
        a.notes, a.response, a.created_at, a.updated_at,
        o.id AS o_id, o.title AS o_title, o.company AS o_company,
        o.location AS o_location, o.status AS o_status, o.match_score AS o_match_score
      FROM applications a
      LEFT JOIN offers o ON a.offer_id = o.id
      ORDER BY a.sent_at DESC
    `);

    const rows = result.recordset.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        application: mapApplication(row),
        offer: row["o_id"] ? mapOffer(row) : null,
      };
    });

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { offerId: number; notes?: string };
    const pool = await getPool();

    // Marquer l'offre comme envoyée
    await pool
      .request()
      .input("offerId", sql.Int, body.offerId)
      .query("UPDATE offers SET status = 'sent', updated_at = GETDATE() WHERE id = @offerId");

    // Créer la candidature
    const result = await pool
      .request()
      .input("offerId", sql.Int, body.offerId)
      .input("notes", sql.NVarChar(sql.MAX), body.notes ?? "")
      .query(`
        INSERT INTO applications (offer_id, status, notes, sent_at, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES (@offerId, 'sent', @notes, GETDATE(), GETDATE(), GETDATE())
      `);

    return NextResponse.json(mapApplication(result.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
