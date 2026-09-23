import OpenAI from "openai";

// Supporte OpenAI (par défaut) ou Groq (gratuit et rapide)
// Pour utiliser Groq : GROQ_API_KEY=... et GROQ_MODEL=llama-3.3-70b-versatile
function getAI() {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (groqKey) {
    return {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      provider: "groq" as const,
    };
  }

  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      provider: "openai" as const,
    };
  }

  throw new Error(
    "Aucune clé API configurée. Définissez GROQ_API_KEY (gratuit sur https://console.groq.com) ou OPENAI_API_KEY"
  );
}

export interface ProfileForAI {
  fullName: string;
  skills: string[];
  languages: string[];
  educationLevel: string;
  fieldOfStudy: string;
  targetCountries: string[];
  keywords: string[];
  cvContent: string;
  availableFrom: string;
  durationMonths: number;
}

export interface OfferForAI {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
}

export interface AIAnalysisResult {
  matchScore: number;
  matchReason: string;
  strengths: string[];
  gaps: string[];
  adaptedCv: string;
  coverLetter: string;
  linkedinMessage: string;
  tags: string[];
}

export async function analyzeOffer(
  profile: ProfileForAI,
  offer: OfferForAI
): Promise<AIAnalysisResult> {
  const profileSummary = `
Nom: ${profile.fullName}
Compétences: ${profile.skills.join(", ")}
Langues: ${profile.languages.join(", ")}
Niveau: ${profile.educationLevel} en ${profile.fieldOfStudy}
Disponible: ${profile.availableFrom} pour ${profile.durationMonths} mois
Pays cibles: ${profile.targetCountries.join(", ")}
CV actuel:
${profile.cvContent || "(non fourni)"}
  `.trim();

  const offerSummary = `
Titre: ${offer.title}
Entreprise: ${offer.company}
Lieu: ${offer.location}
Description: ${offer.description}
Exigences: ${offer.requirements.join(", ")}
  `.trim();

  const { client: openai, model: aiModel } = getAI();
  const response = await openai.chat.completions.create({
    model: aiModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Tu es un expert en recrutement et en rédaction de candidatures pour des PFE (Projets de Fin d'Études) en Europe.
Tu analyses les offres de PFE et tu aides les candidats à préparer des candidatures personnalisées et percutantes.
Réponds UNIQUEMENT en JSON valide avec exactement ces champs:
{
  "matchScore": (0-100, score de correspondance profil/offre),
  "matchReason": (explication concise du score en 2-3 phrases),
  "strengths": (tableau de 3-5 points forts du candidat pour ce poste),
  "gaps": (tableau de 0-3 points à améliorer ou manquants),
  "adaptedCv": (résumé professionnel adapté à cette offre, 150-200 mots, en français),
  "coverLetter": (lettre de motivation complète et personnalisée, en français, 300-400 mots),
  "linkedinMessage": (message LinkedIn court et accrocheur, max 300 caractères, en français),
  "tags": (tableau de 3-5 mots-clés pertinents pour cette offre)
}`,
      },
      {
        role: "user",
        content: `Analyse cette offre de PFE pour ce candidat:\n\n## PROFIL DU CANDIDAT\n${profileSummary}\n\n## OFFRE DE PFE\n${offerSummary}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as AIAnalysisResult;
  } catch {
    return {
      matchScore: 50,
      matchReason: "Analyse indisponible",
      strengths: [],
      gaps: [],
      adaptedCv: "",
      coverLetter: "",
      linkedinMessage: "",
      tags: [],
    };
  }
}

export async function generateSearchQueries(profile: ProfileForAI): Promise<string[]> {
  const { client: openai, model: aiModel } = getAI();
  const response = await openai.chat.completions.create({
    model: aiModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Tu es un expert en recherche d'emploi et de stages en Europe.
Génère des requêtes de recherche optimisées pour trouver des offres de PFE (Projet de Fin d'Études).
Réponds UNIQUEMENT en JSON: { "queries": ["requête1", "requête2", ...] }
Génère entre 8 et 12 requêtes variées en français et en anglais.`,
      },
      {
        role: "user",
        content: `Génère des requêtes de recherche pour trouver des offres de PFE pour ce profil:
- Domaine: ${profile.fieldOfStudy}
- Compétences: ${profile.skills.join(", ")}
- Pays cibles: ${profile.targetCountries.join(", ")}
- Mots-clés: ${profile.keywords.join(", ")}
- Durée: ${profile.durationMonths} mois`,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? '{"queries":[]}';
  try {
    const parsed = JSON.parse(content) as { queries: string[] };
    return parsed.queries ?? [];
  } catch {
    return [`PFE ${profile.fieldOfStudy} Europe`, `internship ${profile.fieldOfStudy} Europe`];
  }
}

export async function summarizeSearchResults(
  offers: { title: string; company: string; location: string; matchScore: number }[]
): Promise<string> {
  if (offers.length === 0) return "Aucune offre trouvée lors de cette session.";

  const { client: openai, model: aiModel } = getAI();
  const response = await openai.chat.completions.create({
    model: aiModel,
    messages: [
      {
        role: "system",
        content: "Tu es un assistant qui résume des résultats de recherche de PFE en 2-3 phrases claires en français.",
      },
      {
        role: "user",
        content: `Résume ces ${offers.length} offres trouvées:\n${offers
          .slice(0, 10)
          .map((o) => `- ${o.title} chez ${o.company} (${o.location}) — score: ${o.matchScore}/100`)
          .join("\n")}`,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content ?? "";
}
