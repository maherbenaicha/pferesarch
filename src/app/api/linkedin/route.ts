import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { LinkedinCredentials } from "@/db/schema";

function mapRow(row: Record<string, unknown>): LinkedinCredentials {
  return {
    id: row["id"] as number,
    email: (row["email"] as string) ?? "",
    passwordHint: row["password_hint"] as string | null,
    sessionCookies: row["session_cookies"] as string | null,
    lastConnected: row["last_connected"] as Date | null,
    isActive: row["is_active"] === true || row["is_active"] === 1,
    createdAt: row["created_at"] as Date | null,
  };
}

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT TOP 1 * FROM linkedin_credentials ORDER BY id"
    );

    if (result.recordset.length === 0) {
      return NextResponse.json({
        id: null,
        email: "",
        isActive: false,
        lastConnected: null,
        passwordHint: "",
      });
    }

    // Ne jamais retourner les cookies de session
    const { sessionCookies: _sc, ...safe } = mapRow(result.recordset[0] as Record<string, unknown>);
    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as {
      email: string;
      password?: string;
      passwordHint?: string;
      isActive?: boolean;
    };

    const pool = await getPool();
    const existing = await pool.request().query(
      "SELECT TOP 1 id FROM linkedin_credentials ORDER BY id"
    );

    const passwordHint =
      body.passwordHint ?? (body.password ? "••••••••" : "");
    const isActive = body.isActive ?? true;

    let result;
    if (existing.recordset.length === 0) {
      result = await pool
        .request()
        .input("email", sql.NVarChar(200), body.email)
        .input("passwordHint", sql.NVarChar(200), passwordHint)
        .input("isActive", sql.Bit, isActive ? 1 : 0)
        .query(`
          INSERT INTO linkedin_credentials (email, password_hint, is_active, last_connected, created_at)
          OUTPUT INSERTED.*
          VALUES (@email, @passwordHint, @isActive, GETDATE(), GETDATE())
        `);
    } else {
      const id = (existing.recordset[0] as Record<string, unknown>)["id"] as number;
      result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("email", sql.NVarChar(200), body.email)
        .input("passwordHint", sql.NVarChar(200), passwordHint)
        .input("isActive", sql.Bit, isActive ? 1 : 0)
        .query(`
          UPDATE linkedin_credentials
          SET email = @email, password_hint = @passwordHint,
              is_active = @isActive, last_connected = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);
    }

    const { sessionCookies: _sc, ...safe } = mapRow(result.recordset[0] as Record<string, unknown>);
    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
