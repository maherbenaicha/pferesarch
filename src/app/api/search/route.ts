import { NextResponse } from "next/server";
import { getPool, sql } from "@/db";
import { parseJsonArray } from "@/db/schema";
import { generateSearchQueries, analyzeOffer } from "@/lib/ai";
import {
  scrapeIndeed,
  scrapeLinkedIn,
  scrapeWelcomeToTheJungle,
  scrapeErasmusIntern,
  type ScrapedOffer,
} from "@/lib/scraper";
import type { SearchSession, SearchStatus } from "@/db/schema";

export const maxDuration = 60;

function mapSession(row: Record<string, unknown>): SearchSession {
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

export async function POST() {
  const pool = await getPool();

  // 1. Charger le profil
  const profileResult = await pool.request().query(
    "SELECT TOP 1 * FROM profiles ORDER BY id"
  );
  if (profileResult.recordset.length === 0) {
    return NextResponse.json({ error: "Profil non configuré" }, { status: 400 });
  }
  const profileRow = profileResult.recordset[0] as Record<string, unknown>;

  const fieldOfStudy = profileRow["field_of_study"] as string | null;
  if (!fieldOfStudy || fieldOfStudy === "") {
    return NextResponse.json(
      { error: "Veuillez compléter votre profil avant de lancer une recherche" },
      { status: 400 }
    );
  }

  // 2. Créer la session
  const sessionResult = await pool.request().query(`
    INSERT INTO search_sessions (status, log, started_at)
    OUTPUT INSERTED.*
    VALUES ('running', N'Démarrage de la recherche...' + CHAR(10), GETDATE())
  `);
  const session = mapSession(sessionResult.recordset[0] as Record<string, unknown>);

  // 3. Traitement en arrière-plan
  void (async () => {
    let log = "Démarrage de la recherche...\n";

    const appendLog = async (msg: string) => {
      log += msg + "\n";
      await pool
        .request()
        .input("log", sql.NVarChar(sql.MAX), log)
        .input("id", sql.Int, session.id)
        .query("UPDATE search_sessions SET log = @log WHERE id = @id");
    };

    try {
      const profileForAI = {
        fullName: (profileRow["full_name"] as string) ?? "",
        skills: parseJsonArray(profileRow["skills"] as string | null),
        languages: parseJsonArray(profileRow["languages"] as string | null),
        educationLevel: (profileRow["education_level"] as string) ?? "",
        fieldOfStudy: fieldOfStudy,
        targetCountries: parseJsonArray(profileRow["target_countries"] as string | null),
        keywords: parseJsonArray(profileRow["keywords"] as string | null),
        cvContent: (profileRow["cv_content"] as string) ?? "",
        availableFrom: (profileRow["available_from"] as string) ?? "",
        durationMonths: (profileRow["duration_months"] as number) ?? 6,
      };

      await appendLog("🤖 Génération des requêtes de recherche par IA...");
      let queries: string[] = [];
      if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY) {
        queries = await generateSearchQueries(profileForAI);
      } else {
        queries = [
          `PFE ${fieldOfStudy} Europe`,
          `Stage ${fieldOfStudy} France`,
          `Internship ${fieldOfStudy} Germany`,
        ];
      }
      await appendLog(`✅ ${queries.length} requêtes générées`);

      // 4. Scraping
      const allScraped: ScrapedOffer[] = [];

      await appendLog("🔍 Recherche sur LinkedIn (pages publiques, sans connexion)...");
      const countries = profileForAI.targetCountries.length
        ? profileForAI.targetCountries
        : ["France"];
      for (const q of queries.slice(0, 3)) {
        for (const country of countries.slice(0, 4)) {
          const res = await scrapeLinkedIn(q, country, { pages: 1, maxDetails: 6, onLog: appendLog });
          allScraped.push(...res);
        }
      }
      await appendLog(`  → ${allScraped.length} offres sur LinkedIn`);

      await appendLog("🔍 Recherche sur Indeed...");
      for (const q of queries.slice(0, 3)) {
        const res = await scrapeIndeed(q);
        allScraped.push(...res);
      }
      await appendLog(`  → ${allScraped.length} offres au total`);

      await appendLog("🔍 Recherche sur Welcome to the Jungle...");
      for (const q of queries.slice(0, 2)) {
        const res = await scrapeWelcomeToTheJungle(q);
        allScraped.push(...res);
      }

      await appendLog("🔍 Recherche sur ErasmusIntern...");
      for (const q of queries.slice(0, 2)) {
        const res = await scrapeErasmusIntern(q);
        allScraped.push(...res);
      }

      // Dédupliquer
      const seen = new Set<string>();
      const unique = allScraped.filter((o) => {
        const key = o.sourceUrl || `${o.title}|${o.company}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      await appendLog(`📋 ${unique.length} offres uniques à analyser`);
      await pool
        .request()
        .input("count", sql.Int, unique.length)
        .input("id", sql.Int, session.id)
        .query("UPDATE search_sessions SET offers_found = @count WHERE id = @id");

      // 5. Analyse IA
      let analyzed = 0;
      const minScore = (profileRow["min_match_score"] as number) ?? 60;

      for (const scraped of unique.slice(0, 20)) {
        try {
          await appendLog(`🤖 Analyse: ${scraped.title} @ ${scraped.company}...`);

          // Déjà en base ? on ne ré-analyse pas.
          const dup = await pool
            .request()
            .input("url", sql.NVarChar(1000), scraped.sourceUrl ?? "")
            .query("SELECT TOP 1 id FROM offers WHERE source_url = @url");
          if (dup.recordset.length > 0) continue;

          if (!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY)) {
            await appendLog("  ⚠️ Pas de clé IA : offre ignorée (aucun score inventé).");
            continue;
          }

          const analysis = await analyzeOffer(profileForAI, {
            title: scraped.title,
            company: scraped.company,
            location: scraped.location,
            description: scraped.description,
            requirements: (scraped.requirements as string[]) ?? [],
          });

          if (analysis.matchScore >= minScore) {
            await pool
              .request()
              .input("sessionId", sql.Int, session.id)
              .input("title", sql.NVarChar(500), scraped.title)
              .input("company", sql.NVarChar(200), scraped.company)
              .input("location", sql.NVarChar(200), scraped.location ?? "")
              .input("country", sql.NVarChar(100), scraped.country ?? "")
              .input("source", sql.NVarChar(100), scraped.source ?? "")
              .input("sourceUrl", sql.NVarChar(1000), scraped.sourceUrl ?? "")
              .input("description", sql.NVarChar(sql.MAX), scraped.description ?? "")
              .input("requirements", sql.NVarChar(sql.MAX), JSON.stringify(scraped.requirements ?? []))
              .input("matchScore", sql.Int, analysis.matchScore)
              .input("matchReason", sql.NVarChar(sql.MAX), analysis.matchReason)
              .input("adaptedCv", sql.NVarChar(sql.MAX), analysis.adaptedCv)
              .input("coverLetter", sql.NVarChar(sql.MAX), analysis.coverLetter)
              .input("linkedinMessage", sql.NVarChar(sql.MAX), analysis.linkedinMessage)
              .input("aiAnalysis", sql.NVarChar(sql.MAX), JSON.stringify(analysis))
              .input("postedAt", sql.NVarChar(50), scraped.postedAt ?? "")
              .query(`
                INSERT INTO offers (
                  session_id, title, company, location, country, source, source_url,
                  description, requirements, match_score, match_reason, adapted_cv,
                  cover_letter, linkedin_message, ai_analysis, posted_at, status,
                  created_at, updated_at
                ) VALUES (
                  @sessionId, @title, @company, @location, @country, @source, @sourceUrl,
                  @description, @requirements, @matchScore, @matchReason, @adaptedCv,
                  @coverLetter, @linkedinMessage, @aiAnalysis, @postedAt, 'pending_review',
                  GETDATE(), GETDATE()
                )
              `);
            analyzed++;
          }
        } catch (err) {
          await appendLog(`  ⚠️ Erreur analyse: ${err}`);
        }
      }

      await appendLog(`✅ ${analyzed} offres retenues (score ≥ ${minScore})`);
      await pool
        .request()
        .input("analyzed", sql.Int, analyzed)
        .input("id", sql.Int, session.id)
        .input("log", sql.NVarChar(sql.MAX), log + "🎉 Recherche terminée!\n")
        .query(`
          UPDATE search_sessions
          SET status = 'done', offers_analyzed = @analyzed,
              finished_at = GETDATE(), log = @log
          WHERE id = @id
        `);
    } catch (err) {
      await pool
        .request()
        .input("log", sql.NVarChar(sql.MAX), log + `❌ Erreur: ${err}\n`)
        .input("id", sql.Int, session.id)
        .query(`
          UPDATE search_sessions
          SET status = 'error', finished_at = GETDATE(), log = @log
          WHERE id = @id
        `);
    }
  })();

  return NextResponse.json({ sessionId: session.id, status: "running" });
}

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      "SELECT TOP 10 * FROM search_sessions ORDER BY id DESC"
    );
    return NextResponse.json(
      result.recordset.map((r) => mapSession(r as Record<string, unknown>))
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
