import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { ApplicationStatus, Application } from "@/db/schema";

function mapRow(row: Record<string, unknown>): Application {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      status?: ApplicationStatus;
      notes?: string;
      response?: string;
      followUpAt?: string;
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
    if (body.response !== undefined) {
      request.input("response", sql.NVarChar(sql.MAX), body.response);
      fields.push("response = @response");
    }
    if (body.followUpAt) {
      request.input("followUpAt", sql.DateTime2, new Date(body.followUpAt));
      fields.push("follow_up_at = @followUpAt");
    }

    const result = await request.query(
      `UPDATE applications SET ${fields.join(", ")} OUTPUT INSERTED.* WHERE id = @id`
    );

    const updated = mapRow(result.recordset[0] as Record<string, unknown>);

    // Synchroniser le statut avec l'offre liée
    if (body.status && updated.offerId) {
      await pool
        .request()
        .input("status", sql.NVarChar(30), body.status)
        .input("offerId", sql.Int, updated.offerId)
        .query("UPDATE offers SET status = @status, updated_at = GETDATE() WHERE id = @offerId");
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
