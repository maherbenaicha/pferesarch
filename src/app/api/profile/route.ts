import { NextRequest, NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import type { Profile } from "@/db/schema";

/** Mappe une ligne SQL Server (snake_case) vers notre interface Profile */
function mapRow(row: Record<string, unknown>): Profile {
  return {
    id: row["id"] as number,
    fullName: (row["full_name"] as string) ?? "",
    email: (row["email"] as string) ?? "",
    phone: row["phone"] as string | null,
    linkedinUrl: row["linkedin_url"] as string | null,
    location: row["location"] as string | null,
    targetCountries: row["target_countries"] as string | null,
    skills: row["skills"] as string | null,
    languages: row["languages"] as string | null,
    educationLevel: row["education_level"] as string | null,
    fieldOfStudy: row["field_of_study"] as string | null,
    availableFrom: row["available_from"] as string | null,
    durationMonths: row["duration_months"] as number | null,
    cvContent: row["cv_content"] as string | null,
    cvFileName: row["cv_file_name"] as string | null,
    keywords: row["keywords"] as string | null,
    excludeKeywords: row["exclude_keywords"] as string | null,
    minMatchScore: row["min_match_score"] as number | null,
    createdAt: row["created_at"] as Date | null,
    updatedAt: row["updated_at"] as Date | null,
  };
}

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT TOP 1 * FROM profiles ORDER BY id"
    );

    if (result.recordset.length === 0) {
      // Créer un profil vide par défaut
      const inserted = await pool.request().query(
        "INSERT INTO profiles (full_name, email) OUTPUT INSERTED.* VALUES ('', '')"
      );
      return NextResponse.json(mapRow(inserted.recordset[0] as Record<string, unknown>));
    }

    return NextResponse.json(mapRow(result.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const pool = await getPool();

    // Récupérer ou créer le profil
    const existing = await pool.request().query(
      "SELECT TOP 1 id FROM profiles ORDER BY id"
    );

    const req2 = pool.request();

    // Champs mis à jour dynamiquement
    const fields: string[] = [];
    const addParam = (col: string, key: string, value: unknown) => {
      req2.input(key, value);
      fields.push(`${col} = @${key}`);
    };

    if (body.fullName !== undefined) addParam("full_name", "fullName", body.fullName);
    if (body.email !== undefined) addParam("email", "email", body.email);
    if (body.phone !== undefined) addParam("phone", "phone", body.phone);
    if (body.linkedinUrl !== undefined) addParam("linkedin_url", "linkedinUrl", body.linkedinUrl);
    if (body.location !== undefined) addParam("location", "location", body.location);
    if (body.targetCountries !== undefined)
      addParam("target_countries", "targetCountries",
        Array.isArray(body.targetCountries) ? JSON.stringify(body.targetCountries) : body.targetCountries);
    if (body.skills !== undefined)
      addParam("skills", "skills",
        Array.isArray(body.skills) ? JSON.stringify(body.skills) : body.skills);
    if (body.languages !== undefined)
      addParam("languages", "languages",
        Array.isArray(body.languages) ? JSON.stringify(body.languages) : body.languages);
    if (body.educationLevel !== undefined) addParam("education_level", "educationLevel", body.educationLevel);
    if (body.fieldOfStudy !== undefined) addParam("field_of_study", "fieldOfStudy", body.fieldOfStudy);
    if (body.availableFrom !== undefined) addParam("available_from", "availableFrom", body.availableFrom);
    if (body.durationMonths !== undefined) addParam("duration_months", "durationMonths", body.durationMonths);
    if (body.cvContent !== undefined) addParam("cv_content", "cvContent", body.cvContent);
    if (body.cvFileName !== undefined) addParam("cv_file_name", "cvFileName", body.cvFileName);
    if (body.keywords !== undefined)
      addParam("keywords", "keywords",
        Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : body.keywords);
    if (body.excludeKeywords !== undefined)
      addParam("exclude_keywords", "excludeKeywords",
        Array.isArray(body.excludeKeywords) ? JSON.stringify(body.excludeKeywords) : body.excludeKeywords);
    if (body.minMatchScore !== undefined) addParam("min_match_score", "minMatchScore", body.minMatchScore);
    fields.push("updated_at = GETDATE()");

    if (existing.recordset.length === 0) {
      // INSERT
      const ins = pool.request();
      const insResult = await ins.query(
        "INSERT INTO profiles (full_name, email) OUTPUT INSERTED.* VALUES ('', '')"
      );
      return NextResponse.json(mapRow(insResult.recordset[0] as Record<string, unknown>));
    }

    const id = (existing.recordset[0] as Record<string, unknown>)["id"] as number;
    req2.input("id", sql.Int, id);

    const updated = await req2.query(
      `UPDATE profiles SET ${fields.join(", ")} OUTPUT INSERTED.* WHERE id = @id`
    );
    return NextResponse.json(mapRow(updated.recordset[0] as Record<string, unknown>));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
