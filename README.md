# 🤖 PFE Hunter — Agent IA de recherche de PFE en Europe

Application web qui automatise la recherche et la préparation de candidatures à des Projets de Fin d'Études (PFE) en Europe, avec validation humaine obligatoire avant tout envoi.

## ✨ Fonctionnalités

- 🔍 **Recherche automatisée** sur LinkedIn, Indeed, Welcome to the Jungle, ErasmusIntern
- 🧠 **Analyse IA** de chaque offre (Groq AI — gratuit)
- 📄 **CV adapté** automatiquement à chaque offre
- 💌 **Lettre de motivation** et **message LinkedIn** personnalisés
- 🔒 **Validation obligatoire** avant tout envoi (double confirmation)
- 📊 **Suivi des candidatures** (envoyée, relancée, entretien, refusée)

## 🚀 Installation

### Pré-requis
- Node.js 18+ 
- PostgreSQL 14+ **OU** SQL Server 2019+
- (Optionnel) Clé API Groq AI : https://console.groq.com (gratuit)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la base de données (voir ci-dessous)

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# 4. Lancer en développement
npm run dev
```

## 🗄️ Configuration de la base de données

### Option A : PostgreSQL (recommandé)

Dans `.env` :
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
```

Puis :
```bash
npx drizzle-kit push
```

### Option B : SQL Server

**Étape 1** : Créez votre base `basepfe` dans SQL Server Management Studio.

**Étape 2** : Exécutez le script `sqlserver/schema.sql` sur votre base.

**Étape 3** : Dans `.env` :
```bash
# ⚠️ Vous devrez adapter le code Drizzle pour SQL Server
# (Drizzle supporte SQL Server en beta 1.0)
DATABASE_URL=sqlserver://VOTRE_SERVEUR:1433;database=basepfe;user=sa;password=VOTRE_MOT_DE_PASSE;encrypt=true;trustServerCertificate=true
```

Voir `docs/SQLSERVER.md` pour la migration complète vers SQL Server.

## 🤖 Configuration Groq AI (gratuit)

1. Créez un compte : https://console.groq.com
2. Générez une clé API
3. Ajoutez dans `.env` :
```bash
GROQ_API_KEY=gsk_votre_cle_ici
GROQ_MODEL=openai/gpt-oss-120b
```

Modèles Groq recommandés (tous gratuits) :
- `openai/gpt-oss-120b` ⭐ Très performant
- `llama-3.3-70b-versatile` Excellent rapport qualité/vitesse
- `llama-3.1-8b-instant` Ultra rapide
- `mixtral-8x7b-32768` Bon pour JSON structuré

## 🏗️ Architecture

- **Frontend** : Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend** : API Routes Next.js
- **Database** : Drizzle ORM (PostgreSQL par défaut, SQL Server via script SQL)
- **IA** : Groq AI (ou OpenAI en fallback)
- **Scraping** : axios + cheerio

## 📝 Notes importantes

- ⚠️ L'utilisation automatisée de LinkedIn doit respecter leurs CGU
- 🔐 L'agent n'envoie **jamais** de candidature sans votre accord explicite
- 🌍 Fonctionne pour toute l'Europe

## 📄 Licence

MIT — Libre d'usage et de modification.
