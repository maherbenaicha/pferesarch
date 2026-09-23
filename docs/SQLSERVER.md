# 🗄️ Migration vers SQL Server

## ⚠️ Note importante

**La version actuelle du ZIP fonctionne avec PostgreSQL.**

Pour utiliser **SQL Server** (votre configuration), deux approches :

---

## Approche 1 : Garder PostgreSQL pour le développement, SQL Server pour la prod

Développez l'app avec PostgreSQL (plus simple), puis déployez sur SQL Server en production.

## Approche 2 : Convertir entièrement vers SQL Server

### Étape 1 : Installer les dépendances SQL Server

```bash
npm install mssql
npm install drizzle-orm@latest  # 1.0+ pour SQL Server
```

### Étape 2 : Créer le schéma

Le script `sqlserver/schema.sql` est fourni. Exécutez-le sur votre base `basepfe` dans SSMS.

### Étape 3 : Convertir les colonnes JSON

SQL Server ne supporte pas les arrays JSON nativement comme PostgreSQL. Les colonnes `skills`, `keywords`, etc. sont stockées en `NVARCHAR(MAX)` contenant du JSON sérialisé.

Exemple de manipulation :
```typescript
// Lire
const skills = JSON.parse(profile.skills ?? "[]");
// Écrire
profile.skills = JSON.stringify(["Python", "React"]);
```

### Étape 4 : Adapter `src/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/node-mssql";
import sql from "mssql";

const config = {
  server: "VOTRE_SERVEUR",
  database: "basepfe",
  user: "sa",
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);
await pool.connect();
export const db = drizzle(pool);
```

### Étape 5 : Schéma Drizzle

Si vous utilisez Drizzle 1.0+ (avec support SQL Server beta) :

```typescript
// src/db/schema.ts
import { sqlServerTable, int, nvarchar, text, timestamp, bit } from "drizzle-orm/sql-server-core";

export const profiles = sqlServerTable("profiles", {
  id: int("id").primaryKey().identity(),
  fullName: nvarchar("full_name", { length: 200 }).notNull().default(""),
  // ... etc
});
```

---

## 🎯 Recommandation

**Pour votre cas (usage personnel, pas de production critique)** :

1. **Installez PostgreSQL** sur votre PC (plus simple que SQL Server pour Next.js)
2. Utilisez le projet tel quel avec PostgreSQL
3. Profitez de toutes les fonctionnalités sans modification

Si vous tenez absolument à SQL Server, le script `sqlserver/schema.sql` créera les tables, mais vous devrez adapter le code Drizzle manuellement (voir étapes ci-dessus).

---

## 💡 Alternative simple : utiliser SQLite

Si vous voulez juste tester rapidement sans rien installer :

```bash
npm install better-sqlite3 drizzle-orm
```

Et changez `drizzle.config.json` :
```json
{
  "dialect": "sqlite",
  "schema": "./src/db/schema.ts",
  "dbCredentials": { "url": "./app.db" }
}
```

SQLite est intégré à votre PC, aucune installation supplémentaire requise.
