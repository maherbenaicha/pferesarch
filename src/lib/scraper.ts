import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedOffer {
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  requirements: string[];
  sourceUrl: string;
  source: string;
  postedAt: string;
  externalId?: string;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
};

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
    });
    return res.data as string;
  } catch {
    return "";
  }
}

// ── Indeed France ──────────────────────────────────────────────────────────
export async function scrapeIndeed(query: string, location = "Europe"): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const encodedQuery = encodeURIComponent(query);
  const url = `https://fr.indeed.com/jobs?q=${encodedQuery}&l=${encodeURIComponent(location)}&fromage=30`;

  const html = await fetchPage(url);
  if (!html) return offers;

  const $ = cheerio.load(html);

  $("[data-jk]").each((_, el) => {
    const title = $(el).find("h2.jobTitle span").text().trim();
    const company = $(el).find("[data-testid='company-name']").text().trim();
    const loc = $(el).find("[data-testid='text-location']").text().trim();
    const jobKey = $(el).attr("data-jk") ?? "";
    const description = $(el).find(".job-snippet").text().trim();

    if (title && company) {
      offers.push({
        title,
        company,
        location: loc,
        country: detectCountry(loc),
        description,
        requirements: [],
        sourceUrl: `https://fr.indeed.com/viewjob?jk=${jobKey}`,
        source: "Indeed",
        postedAt: new Date().toISOString().split("T")[0],
      });
    }
  });

  return offers.slice(0, 10);
}

// ── LinkedIn (pages publiques "guest", SANS connexion ni cookies) ──────────
// Volontairement sans login : se connecter par script à un vrai compte est ce
// qui déclenche restrictions/bannissements. On s'arrête net au moindre signe de
// blocage (429, 999, authwall, captcha) : aucun contournement.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (min: number, max: number) => min + Math.random() * (max - min);

export class LinkedInBlockedError extends Error {}

async function linkedinGet(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: HEADERS,
    timeout: 15000,
    maxRedirects: 2,
    validateStatus: () => true,
  });
  const finalUrl: string = res.request?.res?.responseUrl ?? url;
  if (
    [401, 403, 429, 999].includes(res.status) ||
    /authwall|\/login|checkpoint|captcha/i.test(finalUrl)
  ) {
    throw new LinkedInBlockedError(`Accès limité par LinkedIn (HTTP ${res.status})`);
  }
  if (res.status >= 400) return "";
  return res.data as string;
}

function cleanText(html: string): string {
  const $ = cheerio.load(`<div id="r">${html}</div>`);
  $("br").replaceWith("\n");
  $("li").each((_, li) => { $(li).prepend("• ").append("\n"); });
  $("p, div, ul").each((_, e) => { $(e).append("\n"); });
  return $("#r").text().replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

export interface LinkedInOptions {
  pages?: number;        // 1 page ≈ 10 offres (défaut 2)
  withDetails?: boolean; // récupère la description complète (défaut true)
  maxDetails?: number;   // plafond de fiches détaillées par requête (défaut 10)
  onLog?: (msg: string) => void;
}

export async function scrapeLinkedIn(
  query: string,
  location = "France",
  opts: LinkedInOptions = {}
): Promise<ScrapedOffer[]> {
  const { pages = 2, withDetails = true, maxDetails = 10, onLog } = opts;
  const offers: ScrapedOffer[] = [];
  const seen = new Set<string>();

  try {
    for (let page = 0; page < pages; page++) {
      const url =
        "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search" +
        `?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}` +
        `&f_JT=I&f_TPR=r2592000&start=${page * 10}`;

      const html = await linkedinGet(url);
      if (!html) break;
      const $ = cheerio.load(html);
      const cards = $("li");
      if (cards.length === 0) break;

      cards.each((_, el) => {
        const urn = $(el).find("[data-entity-urn]").attr("data-entity-urn") ?? "";
        const jobId = urn.split(":").pop() ?? "";
        const title = $(el).find(".base-search-card__title").text().trim();
        const company = $(el).find(".base-search-card__subtitle").text().trim();
        const loc = $(el).find(".job-search-card__location").text().trim();
        const posted = $(el).find("time").attr("datetime") ?? "";
        if (!jobId || !title || !company || seen.has(jobId)) return;
        seen.add(jobId);
        offers.push({
          externalId: jobId,
          title,
          company,
          location: loc,
          country: detectCountry(loc || location),
          description: "",
          requirements: [],
          sourceUrl: `https://www.linkedin.com/jobs/view/${jobId}`,
          source: "LinkedIn",
          postedAt: posted || new Date().toISOString().split("T")[0],
        });
      });

      await sleep(jitter(2500, 5000));
    }

    if (withDetails) {
      for (const offer of offers.slice(0, maxDetails)) {
        const html = await linkedinGet(
          `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${offer.externalId}`
        );
        if (html) {
          const $ = cheerio.load(html);
          const desc = $(".show-more-less-html__markup").html() ?? "";
          if (desc) offer.description = cleanText(desc);
          const criteria = $(".description__job-criteria-text")
            .map((_, e) => $(e).text().trim()).get();
          offer.requirements = criteria.filter(Boolean);
        }
        await sleep(jitter(2500, 5000));
      }
    }
  } catch (e) {
    if (e instanceof LinkedInBlockedError) {
      onLog?.(`⛔ ${e.message} — arrêt de la collecte LinkedIn (pas de contournement).`);
    } else {
      onLog?.(`⚠️ Erreur LinkedIn: ${String(e)}`);
    }
  }

  // Offres sans description complète : on garde le titre comme contexte minimal
  for (const o of offers) if (!o.description) o.description = `${o.title} — ${o.company}`;
  return offers;
}

// ── Glassdoor ─────────────────────────────────────────────────────────────
export async function scrapeWelcomeToTheJungle(query: string): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.welcometothejungle.com/fr/jobs?query=${encodedQuery}&aroundQuery=Europe&refinementList%5Bcontract_type%5D%5B%5D=internship`;

  const html = await fetchPage(url);
  if (!html) return offers;

  const $ = cheerio.load(html);

  $("article[data-testid='job-card']").each((_, el) => {
    const title = $(el).find("h3").text().trim();
    const company = $(el).find("[data-testid='job-card-company-name']").text().trim();
    const loc = $(el).find("[data-testid='job-card-location']").text().trim();
    const link = $(el).find("a").attr("href") ?? "";

    if (title && company) {
      offers.push({
        title,
        company,
        location: loc,
        country: detectCountry(loc),
        description: `Offre de stage/PFE: ${title}`,
        requirements: [],
        sourceUrl: link.startsWith("http") ? link : `https://www.welcometothejungle.com${link}`,
        source: "Welcome to the Jungle",
        postedAt: new Date().toISOString().split("T")[0],
      });
    }
  });

  return offers.slice(0, 8);
}

// ── Internshala / EuroPlacement (mock structured data) ────────────────────
export async function scrapeErasmusIntern(query: string): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const encodedQuery = encodeURIComponent(query);
  const url = `https://erasmusintern.org/traineeships?search=${encodedQuery}`;

  const html = await fetchPage(url);
  if (!html) return offers;

  const $ = cheerio.load(html);

  $(".traineeship-list-item, .job-item, article.internship").each((_, el) => {
    const title = $(el).find("h2, h3, .title").first().text().trim();
    const company = $(el).find(".company, .organization, .employer").first().text().trim();
    const loc = $(el).find(".location, .city, .country").first().text().trim();
    const link = $(el).find("a").first().attr("href") ?? "";

    if (title && company) {
      offers.push({
        title,
        company,
        location: loc,
        country: detectCountry(loc),
        description: `Stage/PFE: ${title} chez ${company}`,
        requirements: [],
        sourceUrl: link.startsWith("http") ? link : `https://erasmusintern.org${link}`,
        source: "ErasmusIntern",
        postedAt: new Date().toISOString().split("T")[0],
      });
    }
  });

  return offers.slice(0, 8);
}

// ── Country detection ──────────────────────────────────────────────────────
function detectCountry(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("france") || loc.includes("paris") || loc.includes("lyon") || loc.includes("toulouse")) return "France";
  if (loc.includes("germany") || loc.includes("allemagne") || loc.includes("berlin") || loc.includes("munich")) return "Allemagne";
  if (loc.includes("spain") || loc.includes("espagne") || loc.includes("madrid") || loc.includes("barcelona")) return "Espagne";
  if (loc.includes("netherlands") || loc.includes("pays-bas") || loc.includes("amsterdam")) return "Pays-Bas";
  if (loc.includes("belgium") || loc.includes("belgique") || loc.includes("brussels") || loc.includes("bruxelles")) return "Belgique";
  if (loc.includes("switzerland") || loc.includes("suisse") || loc.includes("zurich") || loc.includes("genève")) return "Suisse";
  if (loc.includes("sweden") || loc.includes("suède") || loc.includes("stockholm")) return "Suède";
  if (loc.includes("finland") || loc.includes("finlande") || loc.includes("helsinki")) return "Finlande";
  if (loc.includes("italy") || loc.includes("italie") || loc.includes("rome") || loc.includes("milan")) return "Italie";
  if (loc.includes("portugal") || loc.includes("lisbon") || loc.includes("lisbonne")) return "Portugal";
  if (loc.includes("ireland") || loc.includes("irlande") || loc.includes("dublin")) return "Irlande";
  return "Europe";
}
