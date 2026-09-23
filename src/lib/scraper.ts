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

// ── LinkedIn (public job search) ───────────────────────────────────────────
export async function scrapeLinkedIn(query: string, location = "Europe"): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = [];
  const encodedQuery = encodeURIComponent(query);
  const encodedLocation = encodeURIComponent(location);
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedQuery}&location=${encodedLocation}&f_TP=1,2&f_JT=I&start=0`;

  const html = await fetchPage(url);
  if (!html) return offers;

  const $ = cheerio.load(html);

  $("li").each((_, el) => {
    const title = $(el).find(".base-search-card__title").text().trim();
    const company = $(el).find(".base-search-card__subtitle").text().trim();
    const loc = $(el).find(".job-search-card__location").text().trim();
    const link = $(el).find("a.base-card__full-link").attr("href") ?? "";
    const timeAgo = $(el).find("time").text().trim();

    if (title && company) {
      offers.push({
        title,
        company,
        location: loc,
        country: detectCountry(loc),
        description: `Offre ${title} chez ${company}`,
        requirements: [],
        sourceUrl: link,
        source: "LinkedIn",
        postedAt: timeAgo || new Date().toISOString().split("T")[0],
      });
    }
  });

  return offers.slice(0, 10);
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

// ── Simulate fallback offers when scraping yields nothing ──────────────────
export function generateSimulatedOffers(
  queries: string[],
  targetCountries: string[]
): ScrapedOffer[] {
  const companies = [
    { name: "Airbus", location: "Toulouse, France", country: "France" },
    { name: "Thales", location: "Paris, France", country: "France" },
    { name: "SAP", location: "Berlin, Allemagne", country: "Allemagne" },
    { name: "Siemens", location: "Munich, Allemagne", country: "Allemagne" },
    { name: "Amadeus", location: "Madrid, Espagne", country: "Espagne" },
    { name: "CERN", location: "Genève, Suisse", country: "Suisse" },
    { name: "AB InBev", location: "Bruxelles, Belgique", country: "Belgique" },
    { name: "Philips", location: "Amsterdam, Pays-Bas", country: "Pays-Bas" },
    { name: "Nokia", location: "Helsinki, Finlande", country: "Finlande" },
    { name: "Ericsson", location: "Stockholm, Suède", country: "Suède" },
    { name: "Booking.com", location: "Amsterdam, Pays-Bas", country: "Pays-Bas" },
    { name: "Criteo", location: "Paris, France", country: "France" },
  ];

  const filtered = targetCountries.length > 0
    ? companies.filter((c) => targetCountries.some((tc) => c.country.toLowerCase().includes(tc.toLowerCase())))
    : companies;

  const pool = filtered.length > 0 ? filtered : companies;

  return queries.slice(0, 3).flatMap((query, qi) =>
    pool.slice(qi * 2, qi * 2 + 3).map((c) => ({
      title: `PFE / Stage – ${query}`,
      company: c.name,
      location: c.location,
      country: c.country,
      description: `Nous recherchons un(e) étudiant(e) en fin d'études pour un PFE de 6 mois dans le domaine de ${query}. 
Vous intégrerez une équipe dynamique et travaillerez sur des projets innovants dans un environnement international.
Vous aurez l'opportunité de mettre en pratique vos connaissances et de contribuer à des projets concrets.`,
      requirements: [query.split(" ")[0], "Bac+4/5", "Français ou Anglais"],
      sourceUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
      source: "LinkedIn (simulé)",
      postedAt: new Date().toISOString().split("T")[0],
    }))
  ).slice(0, 12);
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
